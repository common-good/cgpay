<script lang="ts">
  import { onMount } from 'svelte'
  import { Html5Qrcode } from 'html5-qrcode'
  import { store } from './storage'

  // Trial screen for the hybrid app: proves offline start, the camera scanner and the round trip to the live site.
  const live = (import.meta.env.VITE_LIVE_URL || 'https://pay.test.commongood.earth').replace(/\/$/, '')
  const hash = new URLSearchParams(location.hash.slice(1))

  // The live dashboard hands over the account's device credentials in the hash; keep them and take them out of the address.
  const handed = hash.get('device')
  hash.delete('device')
  history.replaceState(null, '', location.pathname + (hash.size ? '#' + hash : ''))

  let name = $state<string | null>(null)
  let intent = $state(hash.get('intent') || '')
  let msg = $state('')
  let qr = $state('')
  let scanning = $state(false)
  let camMs = $state<number | null>(null)
  let scanner: Html5Qrcode | null = null

  onMount(() => {
    keepDevice()
    if (intent === 'pay' || intent === 'charge') scan()
    return () => { scanner?.stop().catch(() => {}) }
  })

  async function keepDevice() {
    if (handed) await store.set('device', JSON.parse(handed))
    name = (await store.get<{ name: string }>('device'))?.name ?? null
  }

  async function reachable() {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 5000)
    try { await fetch(live + '/favicon.ico', { mode: 'no-cors', cache: 'no-store', signal: ctl.signal }); return true }
    catch { return false }
    finally { clearTimeout(timer) }
  }

  async function goLive(path = '/') {
    msg = 'Connecting...'
    if (!await reachable()) return msg = 'No connection to the server. The live screens need a signal.'
    location.href = live + path
  }

  async function scan() {
    msg = qr = ''
    scanning = true
    const t0 = performance.now()
    try {
      scanner ??= new Html5Qrcode('reader')
      await scanner.start({ facingMode: 'environment' }, { fps: 5, qrbox: 250 }, async text => {
        await scanner?.stop()
        scanning = false
        qr = text
      }, () => {})
      camMs = Math.round(performance.now() - t0)
    } catch (er) {
      scanning = false
      msg = `Camera error: ${er}`
    }
  }

  async function stop() {
    await scanner?.stop().catch(() => {})
    scanning = false
  }
</script>

<main>
  <h1>CGPay <small>bundled screen</small></h1>

  <p data-testid="acct">{name ? `Account: ${name}` : 'No account yet. Open Dashboard and sign in.'}</p>
  {#if intent}<p data-testid="intent">Asked to: {intent}</p>{/if}

  <div id="reader" class:hidden={!scanning}></div>
  {#if camMs !== null && scanning}<p>Camera started in {camMs} ms</p>{/if}
  {#if qr}<p data-testid="qr">Scanned: <code>{qr}</code></p>{/if}
  {#if msg}<p data-testid="msg" class="bad">{msg}</p>{/if}

  <div class="btns">
    {#if scanning}
      <button onclick={stop}>Stop camera</button>
    {:else}
      <button data-testid="btn-scan" onclick={scan}>Scan a QR code</button>
    {/if}
    <button data-testid="btn-dashboard" onclick={() => goLive('/')}>Dashboard (live site)</button>
  </div>

  <p class="foot">Live site: {live}<br />{navigator.userAgent}</p>
</main>

<style>
  :global(body) { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f5f7f4; color: #1a1f1c; }
  main { padding: max(16px, env(safe-area-inset-top)) 16px 16px; max-width: 480px; margin: 0 auto; }
  h1 { color: #0946A6; font-size: 1.5rem; }
  small { font-size: 0.8rem; color: #5a615e; }
  .bad { color: #b3261e; }
  .hidden { display: none; }
  #reader { width: 100%; margin: 12px 0; }
  .btns { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
  button { font: inherit; padding: 14px; border-radius: 8px; border: 0; background: #1e7a3a; color: #fff; }
  .foot { margin-top: 32px; font-size: 0.75rem; color: #5a615e; word-break: break-all; }
</style>
