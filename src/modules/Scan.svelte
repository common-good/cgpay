<script>
  import { Html5Qrcode } from 'html5-qrcode'
  import { onMount } from 'svelte'
  import st from'#store.js'
  import u from '#utils.js'
  import cgLogo from '#modules/assets/cg-logo-300-noR.png?webp'

  // --------------------------------------------

  let isLoading = true
  let di = 0 // default to first device
  let action = ''

  switch($st.intent) {
    case 'charge':
      action = st.selfServe() ? 'Pay' : 'Charge'
      break
    case 'scanIn':
      action = "Scan In"
      break
    default:
      action = $st.intent
  }

  onMount(async () => {
    if (!$st.intent) u.goEr(u.crash('scan with no intent'))
    try {
      Html5Qrcode.getCameras().then(devices => {
        if (devices?.length) {
          st.setCameraCount(devices.length)
          if (devices.length > 1) { // choose front or rear camera as appropriate (ignore camera #3+)
            if (/rear/.test(devices[0].label) ? $st.frontCamera : !$st.frontCamera) di = 1
          }
          const cameraId = devices[di].id
          const scanner = new Html5Qrcode('scanner')

          scanner.start(
            cameraId, 
            { qrbox: { width: 250, height: 250 } }, // Configuration options.

            async (decodedText, decodedResult) => { // Handle code
              await scanner.stop()
              st.setQr(decodedText)
              u.go($st.intent == 'scanIn' ? 'home' : 'tx')
            },
            (erMsg) => { } // ignore "parse" errors -- no valid QR yet (keep scanning)

          ).then((res) => {
            isLoading = false
          }).catch((er) => { // Handle scan error
            u.goEr(er.message)
          })
        } else {
          u.goEr('No camera is available.')
        }
      })
    } catch(er) {
       u.goEr(er.message) 
    }
  })
</script>

<svelte:head>
  <title>CGPay - Scan QR Code</title>
</svelte:head>

<section class="page" id="scan">
  <div class='top'>
    <h1 class="page-title">Scan to {action}</h1>
    {#if isLoading}
      <div class='loading'>
        <img class='logo' src= { cgLogo } alt="Common Good logo" />
        <p>Loading Camera...</p>
      </div>
    {/if}
      <div id='scanner'></div> 
  </div>
</section>

<style lang='stylus'>
  h1
    text-transform capitalize
    
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
