<script>
  import { onMount } from 'svelte'
  import store from '#store.js'
  import { dlg } from '#utils.js'
  import Modal from '../Modal.svelte'; let m0, m1, m2
  import cgLogo from '#modules/Root/assets/cg-logo-300.png?webp'
  import cgLogoDemo from '#modules/Root/assets/cg-logo-300-demo.png?webp'
  import { navigateTo } from 'svelte-router-spa'
  import Balance from '../Balance/Balance.svelte';

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)
  const myQr = $store.myAccount?.qr

  function er(msg) { 
    ({ m0, m1 } = dlg('Alert', msg, 'Close', () => m0 = false)); m0=m0; m1=m1
    store.setMsg(null)
  }

  function version() { let v = _version_ + ''; return v.substring(0, v.length - 2) + '.' + v.substring(v.length - 2) } // won't build if we use .toString() here

  function fake(code) {
    store.setQr(code)
    navigateTo('/charge')
  }
  //   store.setQr('HTTP://6VM.RC4.ME/H0G0NyCBBlUF1qWNZ2k'); navigateTo('/charge') // HTTP://6VM.RC4.ME/H0G0NyCBBlUF1qWNZ2k or H6VM0G0NyCBBlUF1qWNZ2k.

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
    <Balance />
    { #if myQr }
    <div class='top'>
      <h2>Show this code to pay</h2>
      <img src="{ myQr }" alt="my QR code" />
    </div>
    { :else }
      <div class='top business'>
        <h1>Ready to charge people.</h1>
        <div class='watermark'>
          <img class='logo' src= { $store.testing ? cgLogoDemo : cgLogo } alt='Common Good Logo' />
          <p>CGPay v{ version() }</p>
          <div><h1>&nbsp;</h1></div> <!-- to center the logo vertically -->
        </div>
      </div>
    { /if }
    { #if $store.testing }
      <div class="fakes">
        <button on:click={ () => fake('G6VM0RZzhWMCq0zcBowqw.') }>Susan</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/G00WeHlioM5JZv1O9G') }>Maria</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/H010WeHlioM5JZv1O9G') }>Store</button>
        <button on:click={ () => fake('H6VM0G0NyCBBlUF1qWNZ2k.') }>Helga's</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/H0G0NyCBBlUF1qWNZ2k') }>Helga2</button>
        <button on:click={ () => fake('H6VM0G0NyCBBlUF.') }>Bad Online</button>
        <button on:click={ () => fake('garbage.') }>Bad</button>
      </div>
    { /if }
    <div class="actions">
      <a class="scan-customer" href='/scan'>Scan QR Code to Charge</a>
    </div>
</section>

<style lang='stylus'>
  a
    cgButton()
    width 100%

  .actions
    width 100%

  .fakes
    display flex
    justify-content space-between

  .fakes button
    cgButtonSecondary()
    padding 5px
    margin-bottom $s0
    flex-grow 1
    margin-right $s-2

  h2
    font-weight 400
    margin-bottom $s-1

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
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content center

    p
      text(lg)
      text-align center
      margin-bottom $s0

  .watermark
    opacity 0.5
    text-align center
    margin auto
    font-size $s-1

    img
      margin-bottom $s0
</style>
