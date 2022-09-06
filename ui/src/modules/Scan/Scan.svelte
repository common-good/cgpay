<script>
  import { Html5Qrcode } from 'html5-qrcode'
  import { navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'

  import store from '#app.store.js'

  // --------------------------------------------

  onMount(async () => {
    const devices = await Html5Qrcode.getCameras()

    if (devices?.length) {
      const cameraId = devices[0].id
      const scanner = new Html5Qrcode('scan-reader')

      scanner.start(
        cameraId, 

        // Configuration options.
        {},

        // Handle scanned code.
        async (decodedText, decodedResult) => {
          // TODO: Do something with this.
          console.log(decodedText, decodedResult)

          await scanner.stop()
          navigateTo('/charge')
        },

        // Handle error while scanning code.
        (errorMessage) => {
        })

        // Handle library/startup error.
        .catch(error => {
        })
    }
  })
</script>

<svelte:head>
  <title>CG Pay - Scan QR Code</title>
</svelte:head>

<section id='scan'>
  <h1>Scan QR Code</h1>
  <p>{ $store.accounts.linked.name }</p>

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
