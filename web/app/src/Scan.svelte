<script lang="ts">
  import { onMount } from 'svelte'
  import { Html5Qrcode } from 'html5-qrcode'

  let { intent, onscan, onfail }: { intent: string, onscan: (qr: string) => void, onfail: (msg: string) => void } = $props()
  let loading = $state(true)
  let scanner: Html5Qrcode | undefined

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
      await scanner.start({ facingMode: 'environment' }, { fps: 2, qrbox: { width: 250, height: 250 } }, async text => {
        await halt()
        onscan(text)
      }, () => {}) // no valid QR yet: keep looking
      loading = false
    } catch {
      onfail('No camera is available.')
    }
  }
</script>

<section class="page">
  <h1 data-testid="scan-title">Scan to {intent}</h1>
  {#if loading}<p class="loading">Loading Camera...</p>{/if}
  <div id="scanner"></div>
</section>

<style>
  h1 { text-transform: capitalize; text-align: center; }
  .loading { font-style: italic; text-align: center; }
  #scanner :global(video) { width: auto !important; }
</style>
