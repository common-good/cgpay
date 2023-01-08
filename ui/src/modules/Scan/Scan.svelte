<script>
  import { Html5Qrcode } from 'html5-qrcode'
  import { navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import store from '#app.store.js'

  onMount(async () => {
    store.qr.set('HTTP://6VM.RC4.ME/H0G0NyCBBlUF1qWNZ2k'); navigateTo('/charge') // HTTP://6VM.RC4.ME/H0G0NyCBBlUF1qWNZ2k or H6VM0G0NyCBBlUF1qWNZ2k.
    /*
    const devices = await Html5Qrcode.getCameras()

    if (devices?.length) {
      const cameraId = devices[0].id
      const scanner = new Html5Qrcode('scan-reader')

      scanner.start(
        cameraId, 

        // Configuration options.
        {},

        // Handle code.
        async (decodedText, decodedResult) => {
          store.qr.set(decodedText);

          await scanner.stop()
          navigateTo('/charge')
        },

        // Handle scan error.
        (errorMessage) => {
        })

        // Handle library/startup error.
        .catch((err) => {
        })
    }*/
  })
</script>

<svelte:head>
  <title>CG Pay - Scan QR Code</title>
</svelte:head>

<section id='scan'>
  <h1>Scan QR Code</h1>

  <div id='scan-reader-container'>
    <div id='scan-reader' />
  </div>
</section>

<style lang='stylus'>
  h1
    font-weight 600
    text lg
    text-align center
    margin 0 0 $s2

  #scan-reader-container
    cgCard()
    background $c-green

  #scan-reader
    contentCentered()

    :global(video)
      width auto !important
</style>
