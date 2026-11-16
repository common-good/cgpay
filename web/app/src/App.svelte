<script lang="ts">
  import { onMount } from 'svelte'
  import type { Device } from '$lib/app-shell'
  import { store } from './storage'
  import { flush, waiting } from './lib/tx'
  import { toDashboard } from './lib/leave'
  import Scan from './Scan.svelte'
  import Tx from './Tx.svelte'
  import TxStart from './TxStart.svelte'

  // The bundled screens of the store app. The live dashboard opens them with #intent=pay|charge (or none) and the account's device credentials.
  const live = (import.meta.env.VITE_LIVE_URL || 'https://pay.test.commongood.earth').replace(/\/$/, '')
  const hash = new URLSearchParams(location.hash.slice(1))
  const handed = hash.get('device') // credentials stay out of the address
  let intent = $state(hash.get('intent') || '')
  history.replaceState(null, '', location.pathname)

  type Screen = 'home' | 'tx-start' | 'scan' | 'tx'
  let device = $state<Device | null>(null)
  let screen = $state<Screen | ''>('')
  let qr = $state('')
  let queued = $state(0)
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
    setInterval(() => queued && sendQueued(), 5000) // the online event is not reliable on phones
    sendQueued()
    if (device && (intent === 'pay' || intent === 'charge')) start(intent); else screen = 'home'
  })

  // Companies have nothing to show, so they go straight to scanning.
  function start(what: string) { intent = what; screen = device!.isCo ? 'scan' : 'tx-start' }
</script>

<main data-screen={screen}>
  {#if screen === 'tx-start' && device}
    <TxStart {device} {intent} onscan={() => screen = 'scan'} phpBase={device.api.replace(/api\/?$/, '')} />
  {:else if screen === 'scan'}
    <Scan {intent} onscan={text => { qr = text; screen = 'tx' }} onfail={fail} />
  {:else if screen === 'tx' && device}
    <Tx {device} {intent} {qr} onfail={fail} ondone={(msg, offline) => offline ? (queued = 1, screen = 'home', sendQueued()) : toDashboard(live, msg)} />
  {:else if screen === 'home'}
    <h1>CGPay</h1>
    {#if queued}<p data-testid="queued">{queued} transaction{queued == 1 ? '' : 's'} waiting to send</p>{/if}
    <p data-testid="acct">{device ? `Account: ${device.name}` : 'No account yet. Open Dashboard and sign in.'}</p>
    {#if device}
      <button data-testid="btn-pay" onclick={() => start('pay')}>Pay</button>
      <button data-testid="btn-receive" onclick={() => start('charge')}>Charge</button>
    {/if}
    <button data-testid="btn-dashboard" onclick={() => toDashboard(live)}>Dashboard (live site)</button>
    <p class="foot">Live site: {live}</p>
  {/if}
</main>

<style>
  :global(body) { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f5f7f4; color: #1a1f1c; }
  main { padding: max(16px, env(safe-area-inset-top)) 16px 16px; max-width: 480px; margin: 0 auto; }
  h1 { color: #0946A6; font-size: 1.5rem; }
  :global(button) { font: inherit; padding: 14px; border-radius: 8px; border: 0; background: #1e7a3a; color: #fff; }
  .foot { margin-top: 32px; font-size: 0.75rem; color: #5a615e; word-break: break-all; }
</style>
