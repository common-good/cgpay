<script lang="ts">
  import { onMount } from 'svelte'
  import { App as CapApp } from '@capacitor/app'
  import { needsUpdate, updateNow } from './lib/update'
  import { clockOff, loadClock } from './lib/clock'
  import Feedback from './Feedback.svelte'
  import { KeepAwake } from '@capacitor-community/keep-awake'
  import { Capacitor } from '@capacitor/core'
  import type { Device } from '$lib/app-shell'
  import { store } from './storage'
  import { dropUnused, flush, refusals, unqueue, waiting } from './lib/tx'
  import { toDashboard } from './lib/leave'
  import { enterUrl, keep, refresh, signOut, token, type Signed } from './lib/auth'
  import { choose, current, member, type Account } from './lib/accounts'
  import { endOf, isRegister, lock, release, sendLock, setOwnerOperated, touch, unlockBy, unlocked, type Scope } from './lib/register'
  import { settings } from './lib/settings'
  import { cardKind, type Card } from './lib/qr'
  import { isDemo, live, mismatch, switchTo, target } from './lib/env'
  import AcctMenu from '$lib/components/AcctMenu.svelte'
  import Signin from './Signin.svelte'
  import Accounts from './Accounts.svelte'
  import Settings from './Settings.svelte'
  import Unlock from './Unlock.svelte'
  import ManagerSignin from './ManagerSignin.svelte'
  import ManagerBanner from '$lib/components/ManagerBanner.svelte'
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

  type Screen = 'signin' | 'home' | 'tx-start' | 'scan' | 'switch' | 'tx' | 'accounts' | 'settings' | 'unlock' | 'feedback'
  let device = $state<Device | null>(null)
  let acct = $state<Account | null>(null) // the account chosen on this phone (null before a token sign-in)
  let unlocking: 'accounts' | 'settings' = 'accounts' // what the password opens
  let after: 'accounts' | 'settings' | 'pay' | 'menu' | '' = '' // what a manager's unlock of a locked cash register goes on to (what was pressed, see ask)
  let screen = $state<Screen | ''>('')
  let qr = $state('')
  let to = $state('') // the env a scanned card of the other kind would take the app to
  let demo = $state(isDemo()) // shows the DEMO mark
  let queued = $state(0)
  let refused = $state<[string, string][]>([]) // transactions the server refused, to show once on the home screen
  let otherAcct = $state('') // the account the live site acted for, when it is not the one this app acts for
  let otherA: Account | undefined // that account, when this app has it too
  let wanted: Account | undefined // the account the mismatch dialog switches to, as soon as the accounts screen opens (after any unlock it needs)
  let resume = '' // what the member came to do (pay or charge), to carry on with after changing account from the mismatch dialog
  let signedIn = $state(false) // a token is on the phone
  let confirming = $state(false) // asking whether to sign out with transactions still waiting
  let txView = $state<Tx>()
  let seen = '' // the card the scanner returned last: still in view when Back returns to the scanner, so it is not taken again
  let register = $state(false) // the chosen account is a company's cash register on this phone (see lib/register)
  $effect(() => { if (Capacitor.isNativePlatform()) (register ? KeepAwake.keepAwake() : KeepAwake.allowSleep()).catch(() => {}) }) // a cash register's screen stays on
  let scope = $state<Scope | ''>('') // what a manager's unlock opens ('' while locked)
  let notice = $state(''), unlockError = $state(''), busy = $state(false)
  let update = $state<string | null>(null) // the store page for a needed update ('' if none named)
  let clock = $state(0) // minutes the phone's clock is slow (or, negative, fast), when far off
  let asking = $state(false), menuOpen = $state(false), owner = $state('') // the Manager Sign-in dialog; the account menu, opened after an unlock from it; whose password unlocks
  let idle: ReturnType<typeof setTimeout> | undefined, touched = 0, since = 0, until = $state(0) // since: when the unlock began; until: when Manager Mode ends, unless the device is used
  let manager: Card | null = null // the card of the manager whose unlock is on, kept only in memory: a payment carries its proof (see makeTx)
  const fail = (msg: string) => register ? void (notice = msg, screen = 'home') : toDashboard(live(), msg, 'error') // a cash register never leaves for the live site on its own
  const UNLOCK_ERRORS: Record<string, string> = {
    'bad-login': 'That password is not right.', 'not-manager': 'That card is not a manager\'s card for this company.', 'bad-card': 'That card is not valid.',
    'wrong-kind': 'That card cannot be used here.', flooding: 'Too many attempts. Try again later.', 'bad-token': 'Sign in again.',
    offline: 'No connection, and that card has not unlocked this device before.'
  }

  // Send what waited for a connection, and show how much still waits and what the server refused.
  async function sendQueued() {
    await flush().catch(() => {})
    queued = await waiting(); refused = await refusals()
  }

  // The member has seen the refusals: forget them here (the server keeps them).
  async function forgetRefused() {
    for (const [k] of refused) await unqueue(k)
    refused = []
  }

  onMount(async () => {
    device = (await store.get<Device>('device')) ?? null
    window.addEventListener('online', sendQueued)
    for (const e of ['pointerdown', 'keydown']) window.addEventListener(e, active)
    const tick = setInterval(() => queued && sendQueued(), 5000) // the online event is not reliable on phones
    if (Capacitor.isNativePlatform()) CapApp.addListener('backButton', () => screen && screen !== 'home' ? back() : (clearInterval(tick), CapApp.exitApp()))
    const sending = sendQueued()
    await loadClock(); clock = clockOff()
    needsUpdate().then(u => { update = u; clock = clockOff() }) // in the background: a slow server must not hold up the screens, and queued payments still go out
    dropUnused().catch(() => {})
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
    if (await settle()) { // a cash register opens to Charge, locked again (unless a manager's unlock is still on, coming back from the live site)
      const u = cold ? null : await unlocked(); scope = u?.scope ?? ''; since = u?.since ?? 0
      if (!scope) return void await openRegister()
    }
    if (scope) active()
    if (want === 'signout') return void (queued ? (screen = 'home', confirming = true) : leave())
    if (want === 'accounts' || want === 'settings') return void open(want)
    if (device && !otherAcct && (intent === 'pay' || intent === 'charge')) return start(intent)
    await sending // a refusal is shown here before the app goes on to the live site
    if (refused.length || !(cold && hasToken && await goLive())) screen = 'home'
  })

  /** Open a live page (the dashboard, by default) signed in as the chosen account, if it can be reached; false if not. */
  async function goLive(to?: string) {
    const url = await enterUrl(to)
    if (url) location.assign(url)
    return !!url
  }

  /**
   * Change account or settings, after the password if the settings ask for it (not on an unlocked cash register: the manager's unlock was enough).
   * A locked cash register asks for a manager first, and another manager's unlock does not reach Change account.
   */
  async function open(which: 'accounts' | 'settings') {
    if (register && !scope) return ask(which)
    if (register && scope === 'company' && which === 'accounts') return void (notice = 'Only the manager signed in on this device can change account.', screen = 'home')
    if (!scope && (await settings()).locked) { unlocking = which; screen = 'unlock' } else screen = which
  }

  /** Whether the chosen account is a cash register here (and note it). */
  async function settle() { return register = await isRegister(acct) }

  // A locked cash register asks for a manager, then goes on to what was pressed.
  function ask(next: typeof after) { after = next; unlockError = ''; asking = true; screen = 'home' }

  // Lock the cash register again (Manager Mode is over): only the company stays on the phone, and the home screen offers just Charge and the Manager Sign-in.
  async function relock() {
    clearTimeout(idle); scope = ''; manager = null; since = until = 0; asking = menuOpen = false
    if (!acct) return
    await lock(acct); acct = await current(); device = acct?.device ?? null; owner = (await member())?.name ?? ''
    screen = 'home'
  }

  // A cash register opens to Charge, locked. ignore: a card still in front of the camera (the one that switched envs), not to be taken as a customer's.
  async function openRegister(ignore = '') { await relock(); if (device) { start('charge'); seen = ignore } }

  // Someone touched the screen (not the Manager Mode banner): an unlocked cash register stays unlocked another IDLE_MS, up to MAX_MS since the unlock (kept on the phone too, for the trip to the live site and back).
  function active(e?: Event) {
    if (!scope || (e?.target instanceof Element && e.target.closest('.manager-banner'))) return
    until = endOf(since); clearTimeout(idle); idle = setTimeout(relock, until - Date.now())
    if (Date.now() - touched > 10000) { touched = Date.now(); touch(scope, since) }
  }

  // A manager's card (qr) or the signed-in member's password unlocks the cash register.
  async function doUnlock(how: { password?: string, qr?: string }) {
    unlockError = ''; busy = true
    try {
      const r = await unlockBy(how, device?.real ?? true)
      if (r.error) return void (unlockError = UNLOCK_ERRORS[r.error] ?? 'That did not work. Try again.', asking = true, screen = 'home')
      scope = r.scope!; since = Date.now(); manager = r.card ?? null; acct = await current(); device = acct?.device ?? null; notice = ''; touched = 0; asking = false; active()
      const next = after; after = ''
      if (next === 'pay' && device) { start('pay'); seen = how.qr ?? '' } // the manager's card is still in front of the camera
      else if (next === 'accounts' || next === 'settings') await open(next)
      else { screen = 'home'; menuOpen = next === 'menu' }
    } finally { busy = false }
  }

  // The owner-operated setting: the company acts as a personal account on this phone (no lock), or becomes a cash register again.
  async function ownerOp(on: boolean) {
    if (!acct) return false
    const was = scope
    if (on) { register = false; scope = ''; clearTimeout(idle) } // before asking the server, so leaving the settings meanwhile does not lock it again
    if (on && !await release().catch(() => false)) { register = true; scope = was; touched = 0; active(); return false }
    await setOwnerOperated(acct.uid, on)
    if (!on) { register = true; await relock() }
    return true
  }

  // Another account was chosen: a cash register opens to Charge, locked; anything else shows its dashboard (or, offline, its home screen).
  async function chosen() {
    screen = '' // nothing to tap while the server answers
    const was = register || !!(await member())?.lockedTo
    acct = await current(); device = acct?.device ?? null; otherAcct = ''
    const r = resume; resume = ''
    if (await settle()) return void await openRegister()
    if (was) await release().catch(() => false) // leaving the cash register: the server lets the token go (it refuses unless the token's member unlocked)
    scope = ''; clearTimeout(idle)
    if (device && (r === 'pay' || r === 'charge')) start(r)
    else if (!await goLive()) screen = 'home'
  }

  // Ask the server whether the token still works and fetch the device credentials again; a token that no longer works signs the member out here too.
  async function check() {
    await sendLock() // a lock made offline goes first, so the server does not hand back every account's credentials
    const r = await refresh()
    if (r.state === 'out') await leave(false)
    else if (r.state === 'ok') { acct = r.account; device = acct?.device ?? null }
  }

  // Forget the account on this phone (token, credentials and, with drop, anything waiting to send) and show the sign-in screen.
  async function leave(drop = true) {
    // The live site's cookie session would outlive the app's sign-out in the WebView, so the live site clears it and sends the app back here.
    const base = live() // signOut returns the app to its own env, but the cookie to clear is the one of the env being left
    if (await signOut(drop)) return location.assign(`${base}/app-signout?${new URLSearchParams({ back: location.origin + '/' })}`)
    device = acct = null; signedIn = confirming = demo = false; queued = 0; seen = ''
    screen = 'signin'
  }

  // A sign-in succeeded: keep the token and accounts, then carry on to what the member came for (the dashboard, unless it was paying or charging).
  async function onsignedin(s: Signed) {
    await keep(s)
    acct = await current(); device = acct?.device ?? null; signedIn = true
    sendQueued()
    if (await settle()) return void await openRegister()
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
    if (intent === 'unlock') return doUnlock({ qr: text })
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
    if (await settle()) return void await openRegister(qr)
    if (!await goLive()) screen = 'home'
  }

  // The member chose to go on with the app's account, though the website was using another: on to what they came for.
  function proceed() { if (device && (intent === 'pay' || intent === 'charge')) start(intent); else otherAcct = '' }

  function start(what: string) { intent = what; seen = ''; notice = ''; otherAcct = ''; screen = device!.isCo ? 'scan' : 'tx-start' }

  // A transaction is done. A cash register stays in the app: back to its home screen with the message, locked again after a payment (a refund is usually a one-off,
  // and right after it is when a manager walks away).
  async function txDone(msg = '', offline = false) {
    if (offline) { queued = 1; sendQueued() }
    if (!register) return offline ? void (screen = 'home') : toDashboard(live(), msg)
    if (scope && intent === 'pay') await relock()
    notice = msg || (offline ? 'Done. It will be sent when there is a connection.' : 'Done.'); screen = 'home'
  }
</script>

{#snippet refusalBox()}
  {#if refused.length}
    <div class="warn" role="alertdialog" data-testid="refusals">
      <p>Common Good could not complete {refused.length === 1 ? 'this transaction' : 'these transactions'}. It has the details and has emailed them to the account.</p>
      {#each refused as [k, text] (k)}<p data-testid="refusal">{text}</p>{/each}
      <button data-testid="btn-refusals-ok" onclick={forgetRefused}>OK</button>
    </div>
  {/if}
{/snippet}

<main data-screen={screen}>
  {#if demo}<p class="demo" data-testid="demo-mark">DEMO</p>{/if}
  {#if clock && screen === 'home'}<p class="notice" data-testid="clock-notice">This phone's clock is {Math.abs(clock)} minutes {clock > 0 ? 'slow' : 'fast'}. The app records transactions at the right time anyway, but please set the phone to get its time automatically.</p>{/if}
  {#if register && scope && screen && screen !== 'signin'}<ManagerBanner {until} onexit={relock} slim={screen === 'scan'} />{/if}
  {#if screen && screen !== 'home' && screen !== 'signin'}<button class="back" data-testid="btn-back" onclick={back}>Back</button>{/if}
  {#if screen === 'signin'}
    <Signin {onsignedin} ondemo={s => { to = 'demo'; onswitched(s) }} />
  {:else if screen === 'unlock'}
    <Unlock onunlocked={() => screen = unlocking} />
  {:else if screen === 'accounts'}
    <Accounts ondone={chosen} />
  {:else if screen === 'feedback'}
    <Feedback />
  {:else if screen === 'settings'}
    <Settings co={acct?.isCo && signedIn && scope !== 'company' ? acct : null} onownerop={ownerOp} />
  {:else if screen === 'tx-start' && device}
    <TxStart {device} {intent} onscan={() => screen = 'scan'} phpBase={device.php} />
  {:else if screen === 'scan'}
    {#key intent}<Scan {intent} ignore={seen} onscan={scanned} onfail={fail} />{/key}<!-- a new scanner after a card unlock goes on to paying: the one that read the card has stopped -->
  {:else if screen === 'switch'}
    <Switch {qr} {to} {onswitched} onreuse={async () => { await switchTo(to); await arrived() }} oncancel={() => { screen = 'scan' }} />
  {:else if screen === 'tx' && device}
    <Tx bind:this={txView} {device} {intent} {qr} manager={scope ? manager : null} onfail={fail} onrescan={() => screen = 'scan'} ondone={txDone} />
  {:else if screen === 'home' && register && !scope}
    <div class="head"><h1>CGPay</h1><AcctMenu name={acct?.name ?? device?.name ?? ''} photo={acct?.photo} items={[]} gate={() => ask('menu')} /></div>
    {#if notice}<p class="notice" data-testid="notice">{notice}</p>{/if}
    {@render refusalBox()}
    {#if queued}<p data-testid="queued">{queued} transaction{queued == 1 ? '' : 's'} waiting to send</p>{/if}
    <p data-testid="acct">Account: {device?.name ?? acct?.name}</p>
    {#if device}<TxStart {device} intent="charge" onscan={() => start('charge')} onpay={() => ask('pay')} phpBase={device.php} />{/if}
    {#if asking}
      <ManagerSignin {busy} {owner} error={unlockError} onscan={() => { intent = 'unlock'; seen = ''; screen = 'scan' }} onpassword={p => doUnlock({ password: p })} oncancel={() => { asking = false; after = '' }} />
    {/if}
  {:else if screen === 'home'}
    <div class="head">
      <h1>CGPay</h1>
      {#if signedIn}
        <AcctMenu bind:open={menuOpen} name={acct?.name ?? device?.name ?? ''} photo={acct?.photo} items={[
          ...(scope === 'company' ? [] : [{ id: 'accounts', label: 'Change account', onclick: () => open('accounts') }]), // another manager's unlock opens only the company
          { id: 'settings', label: 'Settings', onclick: () => open('settings') },
          { id: 'feedback', label: 'Feedback', onclick: () => screen = 'feedback' },
          { id: 'signout', label: 'Sign out', onclick: () => queued ? confirming = true : leave() }
        ]} />
      {/if}
    </div>
    {#if notice}<p class="notice" data-testid="notice">{notice}</p>{/if}
    {#if otherAcct}
      <div class="warn" role="alertdialog" data-testid="acct-warning">
        <p>The website is using {otherAcct}, but this app is set to {acct?.name}.</p>
        <button data-testid="btn-acct-proceed" onclick={proceed}>Continue as {acct?.name}</button>
        {#if otherA}<button data-testid="btn-acct-switch" onclick={() => change(otherA)}>Switch to {otherAcct}</button>{/if}
        <button data-testid="btn-acct-change" onclick={() => change()}>Change account</button>
        <button class="out" data-testid="btn-acct-cancel" onclick={() => toDashboard(live())}>Cancel</button>
      </div>
    {/if}
    {@render refusalBox()}
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
        <button data-testid="btn-signout-anyway" onclick={() => leave()}>Sign out anyway</button>
        <button class="out" data-testid="btn-cancel-signout" onclick={() => confirming = false}>Cancel</button>
      </div>
    {/if}
    <p class="foot">Live site: {live()}</p>
  {/if}
  {#if update !== null}
    <div class="update" data-testid="update" role="alertdialog" aria-modal="true">
      <p>This version of CGPay is too old. Update it to keep paying and charging.</p>
      {#if update || Capacitor.getPlatform() === 'android'}<button data-testid="btn-update" onclick={() => updateNow(update!)}>Update</button>{:else}<p>Get the new version from your phone's app store.</p>{/if}
    </div>
  {/if}
</main>

<style>
  .update { position: fixed; inset: 0; background: #f5f7f4; display: flex; flex-direction: column; justify-content: center; gap: 16px; padding: 24px; text-align: center; z-index: 10; }
  .update button { padding: 14px; border-radius: 8px; background: #1e7a3a; color: #fff; border: 0; font: inherit; }
  :global(body) { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f5f7f4; color: #1a1f1c; }
  main { padding: max(16px, env(safe-area-inset-top)) 16px 16px; max-width: 480px; margin: 0 auto; }
  h1 { color: #0946A6; font-size: 1.5rem; }
  .head { display: flex; align-items: center; justify-content: space-between; }
  :global(button) { font: inherit; padding: 14px; border-radius: 8px; border: 0; background: #1e7a3a; color: #fff; }
  .demo { margin: 0 0 8px; padding: 4px; text-align: center; font-weight: 700; letter-spacing: 0.2em; background: #f5b301; color: #1a1f1c; border-radius: 6px; }
  .back { background: none; color: #0946A6; padding: 4px 0; }
  .out { background: none; color: #0946A6; }
  .notice { padding: 12px; border-radius: 8px; background: #ecf7ef; border: 1px solid #b7dfc3; }
  .err { color: #b91c1c; }
  .warn { margin-top: 16px; padding: 12px; border: 1px solid #fecaca; background: #fef2f2; border-radius: 8px; }
  .foot { margin-top: 32px; font-size: 0.75rem; color: #5a615e; word-break: break-all; }
</style>
