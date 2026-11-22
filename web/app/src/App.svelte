<script lang="ts">
  import { onMount } from 'svelte'
  import { App as CapApp } from '@capacitor/app'
  import { Capacitor } from '@capacitor/core'
  import type { Device } from '$lib/app-shell'
  import { store } from './storage'
  import { flush, waiting } from './lib/tx'
  import { toDashboard } from './lib/leave'
  import { enterUrl, keep, refresh, signOut, token, type Signed } from './lib/auth'
  import { choose, current, member, type Account } from './lib/accounts'
  import { settings } from './lib/settings'
  import { cardKind } from './lib/qr'
  import { isDemo, live, mismatch, switchTo, target } from './lib/env'
  import AcctMenu from '$lib/components/AcctMenu.svelte'
  import Signin from './Signin.svelte'
  import Accounts from './Accounts.svelte'
  import Settings from './Settings.svelte'
  import Unlock from './Unlock.svelte'
  import Scan from './Scan.svelte'
  import Switch from './Switch.svelte'
  import Tx from './Tx.svelte'
  import TxStart from './TxStart.svelte'

  // The bundled screens of the store app. The live dashboard opens them with #intent=pay|charge, or with #screen=home (its Scan link),
  // accounts, settings or signout (its account menu); never with credentials, which come only from the app's store (fetched with its token).
  // With intent and home it adds &acct=uid, the account the live site acts for, so the app can warn when it would act for another.
  // Opened with nothing (the app starting), they go on to the live dashboard when it can be reached.
  const cold = !location.hash
  const hash = new URLSearchParams(location.hash.slice(1))
  let intent = $state(hash.get('intent') || '')
  const sent = Number(hash.get('acct')) || 0
  history.replaceState(null, '', location.pathname)

  type Screen = 'signin' | 'home' | 'tx-start' | 'scan' | 'switch' | 'tx' | 'accounts' | 'settings' | 'unlock'
  let device = $state<Device | null>(null)
  let acct = $state<Account | null>(null) // the account chosen on this phone (null before a token sign-in)
  let unlocking: 'accounts' | 'settings' = 'accounts' // what the password opens
  let screen = $state<Screen | ''>('')
  let qr = $state('')
  let to = $state('') // the env a scanned card of the other kind would take the app to
  let demo = $state(isDemo()) // shows the DEMO mark
  let queued = $state(0)
  let offlineMsg = $state('')
  let otherAcct = $state('') // the account the live site acted for, when it is not the one this app acts for
  let otherA: Account | undefined // that account, when this app has it too
  let wanted: Account | undefined // the account the mismatch dialog switches to, as soon as the accounts screen opens (after any unlock it needs)
  let resume = '' // what the member came to do (pay or charge), to carry on with after changing account from the mismatch dialog
  let signedIn = $state(false) // a token is on the phone
  let confirming = $state(false) // asking whether to sign out with transactions still waiting
  let txView = $state<Tx>()
  let seen = '' // the card the scanner returned last: still in view when Back returns to the scanner, so it is not taken again
  const fail = (msg: string) => toDashboard(live(), msg, 'error')

  // Send what waited for a connection, and show how much still waits.
  async function sendQueued() {
    if (device) await flush(device).catch(() => {})
    queued = await waiting()
  }

  onMount(async () => {
    device = (await store.get<Device>('device')) ?? null
    window.addEventListener('online', sendQueued)
    const tick = setInterval(() => queued && sendQueued(), 5000) // the online event is not reliable on phones
    if (Capacitor.isNativePlatform()) CapApp.addListener('backButton', () => screen && screen !== 'home' ? back() : (clearInterval(tick), CapApp.exitApp()))
    sendQueued()
    const hasToken = !!await token()
    signedIn = hasToken
    if (!signedIn) return void (screen = 'signin') // no account on the phone: skip the home screen
    // With no credentials yet the screens wait for them; otherwise check in the background, but not when the live site sent us here
    // (it just checked the session, and a late refresh could undo an account the member is choosing now).
    if (hasToken) { if (!device) await check(); else if (cold) check() }
    if (screen === 'signin') return
    acct = await current()
    if (sent && acct && acct.uid !== sent) { otherA = (await member())?.accounts.find(a => a.uid === sent); otherAcct = otherA?.name || 'another account' }
    const want = hash.get('screen')
    queued = await waiting()
    if (want === 'signout') return void (queued ? (screen = 'home', confirming = true) : leave())
    if (want === 'accounts' || want === 'settings') return void open(want)
    if (device && !otherAcct && (intent === 'pay' || intent === 'charge')) start(intent)
    else if (!(cold && hasToken && await goLive())) screen = 'home'
  })

  /** Open a live page (the dashboard, by default) signed in as the chosen account, if it can be reached; false if not. */
  async function goLive(to?: string) {
    const url = await enterUrl(to)
    if (url) location.assign(url)
    return !!url
  }

  /** Change account or settings, after the password if the settings ask for it. */
  async function open(which: 'accounts' | 'settings') {
    if ((await settings()).locked) { unlocking = which; screen = 'unlock' } else screen = which
  }

  // Another account was chosen: show its dashboard (or, offline, its home screen).
  async function chosen() {
    acct = await current(); device = acct?.device ?? null; otherAcct = ''
    const r = resume; resume = ''
    if (device && (r === 'pay' || r === 'charge')) start(r)
    else if (!await goLive()) screen = 'home'
  }

  // Ask the server whether the token still works and fetch the device credentials again; a token that no longer works signs the member out here too.
  async function check() {
    const r = await refresh()
    if (r.state === 'out') await leave()
    else if (r.state === 'ok') { acct = r.account; device = acct?.device ?? null }
  }

  // Forget the account on this phone (token, credentials, anything waiting to send) and show the sign-in screen.
  async function leave() {
    // The live site's cookie session would outlive the app's sign-out in the WebView, so the live site clears it and sends the app back here.
    const base = live() // signOut returns the app to its own env, but the cookie to clear is the one of the env being left
    if (await signOut()) return location.assign(`${base}/app-signout?${new URLSearchParams({ back: location.origin + '/' })}`)
    device = acct = null; signedIn = confirming = demo = false; queued = 0; seen = ''
    screen = 'signin'
  }

  // A sign-in succeeded: keep the token and accounts, then carry on to what the member came for (the dashboard, unless it was paying or charging).
  async function onsignedin(s: Signed) {
    await keep(s)
    acct = await current(); device = acct?.device ?? null; signedIn = true
    sendQueued()
    if (device && (intent === 'pay' || intent === 'charge')) start(intent)
    else if (!await goLive()) screen = 'home'
  }

  // Companies have nothing to show, so they go straight to scanning.
  // Back goes to the screen before: from the summary it means undo, and a company, which skips the start page, goes home from the scanner.
  function back() {
    if (screen === 'tx') txView?.back()
    else { screen = screen === 'scan' && device && !device.isCo ? 'tx-start' : 'home'; seen = ''; wanted = undefined; resume = '' }
  }

  $effect(() => { if (screen === 'accounts' && wanted) { const a = wanted; wanted = undefined; choose(a).then(chosen) } })

  // From the mismatch dialog: change account (to a, if given), then carry on with the payment or charge the member came for.
  async function change(a?: Account) {
    wanted = a; resume = intent
    await open('accounts')
    if (screen === 'home') { wanted = undefined; resume = '' } // the change was refused
  }

  // A card of the kind that belongs to the other env asks to switch (anything else is an ordinary scan). Transactions waiting here belong to this env's server, so they go first.
  async function scanned(text: string) {
    qr = seen = text
    const kind = cardKind(text), t = kind && mismatch(kind) ? target(kind) : undefined
    if (t === null) return fail('That card cannot be used in this app.')
    if (t === undefined) return void (screen = 'tx')
    if (await waiting()) return fail('Wait for the waiting transactions to send, then scan the card again.')
    to = t; screen = 'switch'
  }

  // Signed in to the other env: move the app there (the shelf swaps the sign-ins), act for the card's account, and open its dashboard.
  async function onswitched(s: Signed & { account?: number }) {
    await switchTo(to); await keep(s)
    const a = s.accounts.find(a => a.uid === s.account)
    if (a) await choose(a)
    await arrived()
  }

  async function arrived() {
    demo = isDemo(); acct = await current(); device = acct?.device ?? null; signedIn = true; seen = ''
    if (!await goLive()) screen = 'home'
  }

  // The member chose to go on with the app's account, though the website was using another: on to what they came for.
  function proceed() { if (device && (intent === 'pay' || intent === 'charge')) start(intent); else otherAcct = '' }

  function start(what: string) { intent = what; seen = ''; otherAcct = ''; screen = device!.isCo ? 'scan' : 'tx-start' }
</script>

<main data-screen={screen}>
  {#if demo}<p class="demo" data-testid="demo-mark">DEMO</p>{/if}
  {#if screen && screen !== 'home' && screen !== 'signin'}<button class="back" data-testid="btn-back" onclick={back}>Back</button>{/if}
  {#if screen === 'signin'}
    <Signin {onsignedin} ondemo={s => { to = 'demo'; onswitched(s) }} />
  {:else if screen === 'unlock'}
    <Unlock onunlocked={() => screen = unlocking} />
  {:else if screen === 'accounts'}
    <Accounts ondone={chosen} />
  {:else if screen === 'settings'}
    <Settings />
  {:else if screen === 'tx-start' && device}
    <TxStart {device} {intent} onscan={() => screen = 'scan'} phpBase={device.api.replace(/api\/?$/, '')} />
  {:else if screen === 'scan'}
    <Scan {intent} ignore={seen} onscan={scanned} onfail={fail} />
  {:else if screen === 'switch'}
    <Switch {qr} {to} {onswitched} onreuse={async () => { await switchTo(to); await arrived() }} oncancel={() => { screen = 'scan' }} />
  {:else if screen === 'tx' && device}
    <Tx bind:this={txView} {device} {intent} {qr} onfail={fail} onrescan={() => screen = 'scan'} ondone={(msg, offline) => offline ? (queued = 1, screen = 'home', sendQueued()) : toDashboard(live(), msg)} />
  {:else if screen === 'home'}
    <div class="head">
      <h1>CGPay</h1>
      {#if signedIn}
        <AcctMenu name={acct?.name ?? device?.name ?? ''} photo={acct?.photo} items={[
          { id: 'accounts', label: 'Change account', onclick: () => open('accounts') },
          { id: 'settings', label: 'Settings', onclick: () => open('settings') },
          { id: 'feedback', label: 'Feedback', onclick: async () => { if (!await goLive('feedback')) offlineMsg = 'Feedback needs a connection. Try again when you have a signal.' } },
          { id: 'signout', label: 'Sign out', onclick: () => queued ? confirming = true : leave() }
        ]} />
      {/if}
    </div>
    {#if otherAcct}
      <div class="warn" role="alertdialog" data-testid="acct-warning">
        <p>The website is using {otherAcct}, but this app is set to {acct?.name}.</p>
        <button data-testid="btn-acct-proceed" onclick={proceed}>Continue as {acct?.name}</button>
        {#if otherA}<button data-testid="btn-acct-switch" onclick={() => change(otherA)}>Switch to {otherAcct}</button>{/if}
        <button data-testid="btn-acct-change" onclick={() => change()}>Change account</button>
        <button class="out" data-testid="btn-acct-cancel" onclick={() => toDashboard(live())}>Cancel</button>
      </div>
    {/if}
    {#if offlineMsg}<p class="err" data-testid="offline-msg">{offlineMsg}</p>{/if}
    {#if queued}<p data-testid="queued">{queued} transaction{queued == 1 ? '' : 's'} waiting to send</p>{/if}
    <p data-testid="acct">{device ? `Account: ${device.name}` : 'This account cannot use the app yet. Open the dashboard to finish setting it up.'}</p>
    {#if device}
      <button data-testid="btn-pay" onclick={() => start('pay')}>Pay</button>
      <button data-testid="btn-receive" onclick={() => start('charge')}>Charge</button>
    {/if}
    <button data-testid="btn-dashboard" onclick={() => toDashboard(live())}>Dashboard (live site)</button>
    {#if confirming}
      <div class="warn" role="alertdialog" data-testid="signout-warning">
        <p>{queued} transaction{queued == 1 ? '' : 's'} still waiting to send will be lost if you sign out now.</p>
        <button data-testid="btn-signout-anyway" onclick={leave}>Sign out anyway</button>
        <button class="out" data-testid="btn-cancel-signout" onclick={() => confirming = false}>Cancel</button>
      </div>
    {/if}
    <p class="foot">Live site: {live()}</p>
  {/if}
</main>

<style>
  :global(body) { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f5f7f4; color: #1a1f1c; }
  main { padding: max(16px, env(safe-area-inset-top)) 16px 16px; max-width: 480px; margin: 0 auto; }
  h1 { color: #0946A6; font-size: 1.5rem; }
  .head { display: flex; align-items: center; justify-content: space-between; }
  :global(button) { font: inherit; padding: 14px; border-radius: 8px; border: 0; background: #1e7a3a; color: #fff; }
  .demo { margin: 0 0 8px; padding: 4px; text-align: center; font-weight: 700; letter-spacing: 0.2em; background: #f5b301; color: #1a1f1c; border-radius: 6px; }
  .back { background: none; color: #0946A6; padding: 4px 0; }
  .out { background: none; color: #0946A6; }
  .err { color: #b91c1c; }
  .warn { margin-top: 16px; padding: 12px; border: 1px solid #fecaca; background: #fef2f2; border-radius: 8px; }
  .foot { margin-top: 32px; font-size: 0.75rem; color: #5a615e; word-break: break-all; }
</style>
