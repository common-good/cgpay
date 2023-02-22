<script>
  import { onMount } from 'svelte'
  import store from '#store.js'
  import { dlg } from '#utils.js'
  import Modal from '../Modal.svelte'; let m0, m1, m2
  import cgLogo from '#modules/Root/assets/cg-logo-300.png?webp'
  import cgLogoDemo from '#modules/Root/assets/cg-logo-300-demo.png?webp'

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)
  const myQr = $store.myAccount.qr

  function er(msg) { 
    ({ m0, m1 } = dlg('Alert', msg, 'Close', () => m0 = false)); m0=m0; m1=m1
    store.setMsg(null)
  }

  onMount(async () => {
    store.setQr(null) // no going back to previous customer
    if ($store.erMsg) er($store.erMsg)
  })
</script>

<Modal m0={m0} on:m1={m1} on:m2={m2} />

<svelte:head>
  <title>CGPay - Home</title>
</svelte:head>

<section id='home'>
    { #if myQr }
    <div class='top'>
      <h1>Show this code to pay</h1>
      <img src="{ myQr }" alt="my QR code" />
    </div>
    { :else }
      <div class='top business'>
        <h1>Ready to charge people.</h1>
        <div class='watermark'>
          <img class='logo' src= { $store.testing ? cgLogoDemo : cgLogo } alt='Common Good Logo' />
          <p>v alpha</p>
        </div>
      </div>
    { /if }
    <div class="charge">
      <a class="scan-customer" href='/scan'>Scan QR Code to Charge</a>
    </div>
</section>

<style lang='stylus'>
  a
    cgButton()
    width 100%

  h1
    text(lg)
    font-weight 400
    margin-bottom $s2

  img 
    width 250px

  section
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content space-between

  .business
    h1
      margin-bottom $s5

  .top
    width 100%
    display flex
    flex-direction column
    align-items center

  .charge
    width 100%

    p
      text(lg)
      text-align center
      margin-bottom $s0

  .watermark
    opacity 0.5
    text-align center
    font-size $s-1

    img
      margin-bottom $s0
</style>
