<script lang="ts">
  import { onMount } from 'svelte'
  import { App as CapApp } from '@capacitor/app'
  import { Capacitor } from '@capacitor/core'
  import type { Device } from '$lib/app-shell'
  import { store } from './storage'
  import { flush, waiting } from './lib/tx'
  import { toDashboard } from './lib/leave'
  import { keep, refresh, signOut, token, type Signed } from './lib/auth'
  import { live } from './lib/live'
  import Signin from './Signin.svelte'
  import Scan from './Scan.svelte'
  import Tx from './Tx.svelte'
  import TxStart from './TxStart.svelte'

  // The bundled screens of the store app. The live dashboard opens them with #intent=pay|charge (or none) and the account's device credentials.
  const hash = new URLSearchParams(location.hash.slice(1))
  const handed = hash.get('device') // credentials stay out of the address
  let intent = $state(hash.get('intent') || '')
  history.replaceState(null, '', location.pathname)

  type Screen = 'signin' | 'home' | 'tx-start' | 'scan' | 'tx'
  let device = $state<Device | null>(null)
  let screen = $state<Screen | ''>('')
  let qr = $state('')
  let queued = $state(0)
  let signedIn = $state(false) // a token or device credentials are on the phone
  let confirming = $state(false) // asking whether to sign out with transactions still waiting
  let txView = $state<Tx>()
  let seen = '' // the card the scanner returned last: still in view when Back returns to the scanner, so it is not taken again
  const fail = (msg: string) => toDashboard(live, msg, 'error')

  // Send what waited for a connection, and show how much still waits.
  async function sendQueued() {
    if (device) await flush(device).catch(() => {})
    queued = await waiting()
  }

  onMount(async () => {
    if (handed) await store.set('device', JSON.parse(handed))
    device = (await store.get<Device>('device')) ?? null
    window.addEventListener('online', sendQueued)
    if (Capacitor.isNativePlatform()) CapApp.addListener('backButton', () => screen && screen !== 'home' ? back() : CapApp.exitApp())
    setInterval(() => queued && sendQueued(), 5000) // the online event is not reliable on phones
    sendQueued()
    const hasToken = !!await token()
    signedIn = !!device || hasToken
    if (!signedIn) return void (screen = 'signin') // no account on the phone: skip the home screen
    if (hasToken) { if (device) check(); else await check() } // with no credentials yet the screens wait for them; otherwise check in the background
    if (screen === 'signin') return
    if (device && (intent === 'pay' || intent === 'charge')) start(intent); else screen = 'home'
  })

  // Ask the server whether the token still works and fetch the device credentials again; a token that no longer works signs the member out here too.
  async function check() {
    const r = await refresh()
    if (r.state === 'out') await leave()
    else if (r.state === 'ok') device = r.device
  }

  // Forget the account on this phone (token, credentials, anything waiting to send) and show the sign-in screen.
  async function leave() {
    // The live site's cookie session would outlive the app's sign-out in the WebView, so the live site clears it and sends the app back here.
    if (await signOut()) return location.assign(`${live}/app-signout?${new URLSearchParams({ back: location.origin + '/' })}`)
    device = null; signedIn = confirming = false; queued = 0; seen = ''
    screen = 'signin'
  }

  // A sign-in succeeded: keep the token and credentials, then carry on to what the member came for.
  async function onsignedin(s: Signed) {
    await keep(s)
    device = s.device; signedIn = true
    sendQueued()
    if (device && (intent === 'pay' || intent === 'charge')) start(intent); else screen = 'home'
  }

  // Companies have nothing to show, so they go straight to scanning.
  // Back goes to the screen before: from the summary it means undo, and a company, which skips the start page, goes home from the scanner.
  function back() {
    if (screen === 'tx') txView?.back()
    else { screen = screen === 'scan' && device && !device.isCo ? 'tx-start' : 'home'; seen = '' }
  }

  function start(what: string) { intent = what; seen = ''; screen = device!.isCo ? 'scan' : 'tx-start' }
</script>

<main data-screen={screen}>
  {#if screen && screen !== 'home' && screen !== 'signin'}<button class="back" data-testid="btn-back" onclick={back}>Back</button>{/if}
  {#if screen === 'signin'}
    <Signin {onsignedin} />
  {:else if screen === 'tx-start' && device}
    <TxStart {device} {intent} onscan={() => screen = 'scan'} phpBase={device.api.replace(/api\/?$/, '')} />
  {:else if screen === 'scan'}
    <Scan {intent} ignore={seen} onscan={text => { qr = seen = text; screen = 'tx' }} onfail={fail} />
  {:else if screen === 'tx' && device}
    <Tx bind:this={txView} {device} {intent} {qr} onfail={fail} onrescan={() => screen = 'scan'} ondone={(msg, offline) => offline ? (queued = 1, screen = 'home', sendQueued()) : toDashboard(live, msg)} />
  {:else if screen === 'home'}
    <h1>CGPay</h1>
    {#if queued}<p data-testid="queued">{queued} transaction{queued == 1 ? '' : 's'} waiting to send</p>{/if}
    <p data-testid="acct">{device ? `Account: ${device.name}` : 'This account cannot use the app yet. Open the dashboard to finish setting it up.'}</p>
    {#if device}
      <button data-testid="btn-pay" onclick={() => start('pay')}>Pay</button>
      <button data-testid="btn-receive" onclick={() => start('charge')}>Charge</button>
    {/if}
    <button data-testid="btn-dashboard" onclick={() => toDashboard(live)}>Dashboard (live site)</button>
    {#if signedIn}<button class="out" data-testid="btn-signout" onclick={() => queued ? confirming = true : leave()}>Sign out</button>{/if}
    {#if confirming}
      <div class="warn" role="alertdialog" data-testid="signout-warning">
        <p>{queued} transaction{queued == 1 ? '' : 's'} still waiting to send will be lost if you sign out now.</p>
        <button data-testid="btn-signout-anyway" onclick={leave}>Sign out anyway</button>
        <button class="out" data-testid="btn-cancel-signout" onclick={() => confirming = false}>Cancel</button>
      </div>
    {/if}
    <p class="foot">Live site: {live}</p>
  {/if}
</main>

<style>
  :global(body) { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f5f7f4; color: #1a1f1c; }
  main { padding: max(16px, env(safe-area-inset-top)) 16px 16px; max-width: 480px; margin: 0 auto; }
  h1 { color: #0946A6; font-size: 1.5rem; }
  :global(button) { font: inherit; padding: 14px; border-radius: 8px; border: 0; background: #1e7a3a; color: #fff; }
  .back { background: none; color: #0946A6; padding: 4px 0; }
  .out { background: none; color: #0946A6; }
  .warn { margin-top: 16px; padding: 12px; border: 1px solid #fecaca; background: #fef2f2; border-radius: 8px; }
  .foot { margin-top: 32px; font-size: 0.75rem; color: #5a615e; word-break: break-all; }
</style>
