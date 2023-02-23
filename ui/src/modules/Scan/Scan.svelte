<script>
  import { Html5Qrcode } from 'html5-qrcode'
  import { navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import store from '#store.js'
  import { goEr } from '#utils.js'
  import cgLogo from '#modules/Root/assets/cg-logo-300.png?webp'

  // --------------------------------------------

  let isLoading = true
  let di = 0 // default to first device

  onMount(async () => {
  //   store.setQr('HTTP://6VM.RC4.ME/H0G0NyCBBlUF1qWNZ2k'); navigateTo('/charge') // HTTP://6VM.RC4.ME/H0G0NyCBBlUF1qWNZ2k or H6VM0G0NyCBBlUF1qWNZ2k.
    try {
      Html5Qrcode.getCameras().then(devices => {
        if (devices?.length) {
          store.setCameraCount(devices.length)
          if (devices.length > 1) { // choose front or rear camera as appropriate (ignore camera #3+)
            if (/rear/.test(devices[0].label) ? $store.frontCamera : !$store.frontCamera) di = 1
          }
          const cameraId = devices[di].id
          const scanner = new Html5Qrcode('scanner')

          scanner.start(
            cameraId, 
            { qrbox: { width: 250, height: 250 } }, // Configuration options.

            async (decodedText, decodedResult) => { // Handle code
              store.setQr(decodedText)
              await scanner.stop()
              navigateTo('/charge')
            },
            (erMsg) => { } // ignore "parse" errors -- no valid QR yet (keep scanning)

          ).then((res) => {
            isLoading = false
          }).catch((er) => { // Handle scan error
            goEr(er.message)
          })
        } else {
          goEr('No camera is available.')
        }
      })
    } catch(er) {
       goEr(er.message) 
    }
  })
</script>

<svelte:head>
  <title>CGPay - Scan QR Code</title>
</svelte:head>

<section id='scan'>
  <div class='top'>
    <h1>Scan QR Code</h1>
    {#if isLoading}
      <div class='loading'>
        <img class='logo' src= { cgLogo } alt="Common Good logo" />
        <p>Loading Camera...</p>
      </div>
    {/if}
      <div id='scanner'></div> 
  </div>
  <a href="/home">Cancel</a>
</section>

<style lang='stylus'>
  a
    cgButtonSecondary()

  h1
    margin-bottom $s2

  section
    display flex
    flex-direction column
    justify-content space-between
    align-items center
    height 100%

  .loading
    font-style italic
    height 250px
    contentCentered(column)

  .logo
    width: 80px
    margin-bottom $s4
    animation spin 2s linear infinite

  .top
    text-align center

  @keyframes spin 
    0% 
      transform: rotate(0deg)
    100% 
      transform: rotate(360deg)

  /* Needed to show QR Camera */
  #scanner
    :global(video)
      width auto !important
</style>
