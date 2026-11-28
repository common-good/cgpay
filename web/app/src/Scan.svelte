<script lang="ts">
  import { onMount } from 'svelte'
  import { Html5Qrcode } from 'html5-qrcode'
  import { settings } from './lib/settings'
  import { beep } from './lib/beep'

  let { intent, title = '', ignore = '', onscan, onfail }: { intent: string, title?: string, ignore?: string, onscan: (qr: string) => void, onfail: (msg: string) => void } = $props()
  let loading = $state(true)
  let scanner: Html5Qrcode | undefined
  let torch = $state<{ apply(on: boolean): Promise<unknown> } | null>(null), lit = $state(false)

  onMount(() => {
    start()
    return () => { halt() }
  })

  // stop() throws (not rejects) when the camera is not running, which would break the screen change that is tearing this one down.
  const halt = async () => { try { await scanner?.stop() } catch {} }

  async function start() {
    try {
      if (!(await Html5Qrcode.getCameras()).length) return onfail('No camera is available.')
      scanner = new Html5Qrcode('scanner')
      await scanner.start({ facingMode: (await settings()).frontCamera ? 'user' : 'environment' }, { fps: 2, qrbox: { width: 250, height: 250 } }, async text => {
        if (text === ignore) return
        beep()
        await halt()
        onscan(text)
      }, () => {}) // no valid QR yet: keep looking
      loading = false
      try { const t = scanner.getRunningTrackCameraCapabilities().torchFeature(); if (t.isSupported()) torch = t } catch {} // the iPhone's web view and many cameras have no torch control
    } catch {
      onfail('No camera is available.')
    }
  }
</script>

<section class="page">
  <h1 data-testid="scan-title">{title || `Scan to ${intent}`}</h1>
  {#if loading}<p class="loading">Loading Camera...</p>{/if}
  <div id="scanner"></div>
  {#if torch}<button class="torch" data-testid="btn-torch" onclick={() => torch!.apply(lit = !lit).catch(() => lit = !lit)}>{lit ? 'Light off' : 'Light'}</button>{/if}
</section>

<style>
  h1 { text-transform: capitalize; text-align: center; }
  .loading { font-style: italic; text-align: center; }
  #scanner :global(video) { width: auto !important; }
  .torch { display: block; margin: 12px auto 0; }
</style>
