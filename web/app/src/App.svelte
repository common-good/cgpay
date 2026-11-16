<script lang="ts">
  import { onMount } from 'svelte'
  import type { Device } from '$lib/app-shell'
  import { store } from './storage'
  import { toDashboard } from './lib/leave'
  import Scan from './Scan.svelte'
  import Tx from './Tx.svelte'
  import TxStart from './TxStart.svelte'

  // The bundled screens of the store app. The live dashboard opens them with #intent=pay|charge (or none) and the account's device credentials.
  const live = (import.meta.env.VITE_LIVE_URL || 'https://pay.test.commongood.earth').replace(/\/$/, '')
  const hash = new URLSearchParams(location.hash.slice(1))
  const handed = hash.get('device') // credentials stay out of the address
  const intent = hash.get('intent') || ''
  history.replaceState(null, '', location.pathname)

  type Screen = 'home' | 'tx-start' | 'scan' | 'tx'
  let device = $state<Device | null>(null)
  let screen = $state<Screen | ''>('')
  let qr = $state('')
  const fail = (msg: string) => toDashboard(live, msg, 'error')

  onMount(async () => {
    if (handed) await store.set('device', JSON.parse(handed))
    device = (await store.get<Device>('device')) ?? null
    screen = device && (intent === 'pay' || intent === 'charge') ? (device.isCo ? 'scan' : 'tx-start') : 'home'
  })
</script>

<main data-screen={screen}>
  {#if screen === 'tx-start' && device}
    <TxStart {device} {intent} onscan={() => screen = 'scan'} phpBase={device.api.replace(/api\/?$/, '')} />
  {:else if screen === 'scan'}
    <Scan {intent} onscan={text => { qr = text; screen = 'tx' }} onfail={fail} />
  {:else if screen === 'tx' && device}
    <Tx {device} {intent} {qr} onfail={fail} />
  {:else if screen === 'home'}
    <h1>CGPay</h1>
    <p data-testid="acct">{device ? `Account: ${device.name}` : 'No account yet. Open Dashboard and sign in.'}</p>
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
