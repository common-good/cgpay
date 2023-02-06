<script>
  import { Html5Qrcode } from 'html5-qrcode'
  import { navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import store from '#store.js'
  import { goEr } from '#utils.js'

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  onMount(async () => {
//    store.setQr('HTTP://6VM.RC4.ME/H0G0NyCBBlUF1qWNZ2k'); navigateTo('/charge') // HTTP://6VM.RC4.ME/H0G0NyCBBlUF1qWNZ2k or H6VM0G0NyCBBlUF1qWNZ2k.
    const devices = await Html5Qrcode.getCameras()
    .catch(er => { goEr(er.message) })

    if (devices?.length) {
      const cameraId = devices[0].id
      const scanner = new Html5Qrcode('scanner')

      scanner.start(
        cameraId, 
        {}, // Configuration options.

        async (decodedText, decodedResult) => { // Handle code
          store.setQr(decodedText)
          await scanner.stop()
          navigateTo('/charge')
        },
        (erMsg) => { } // ignore parse errors (keep scanning)

      ).catch((er) => { // Handle scan error
          console.log(er.message); 
          goEr(er.message)
      })
    }
  })
</script>

<svelte:head>
  <title>CGPay - Scan QR Code</title>
</svelte:head>

<section id='scan'>
  <h1>Scan QR Code</h1>

  <div id='scanner-container'>
    <div id='scanner' />
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
