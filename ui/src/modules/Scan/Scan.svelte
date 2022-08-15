<script>
  import { Html5Qrcode } from 'html5-qrcode'
  import { navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'

  onMount(async () => {
    const devices = await Html5Qrcode.getCameras()

    if (devices?.length) {
      const cameraId = devices[0].id
      const scanner = new Html5Qrcode('reader')

      scanner.start(
        cameraId, 

        // Configuration options.
        {
          qrbox: { width: 250, height: 250 }
        },

        // Handle code.
        async (decodedText, decodedResult) => {
          // TODO: Do something with this.
          console.log(decodedText, decodedResult)

          await scanner.stop()
          navigateTo('/charge')
        },

        // Handle scan error.
        (errorMessage) => {
        })

        // Handle library/startup error.
        .catch((err) => {
        })
    }
  })
</script>

<svelte:head>
  <title>CG Pay - Scan Code</title>
</svelte:head>

<section id='scan'>
  <h1>Scan Code</h1>
  <div id='reader' />
</section>
