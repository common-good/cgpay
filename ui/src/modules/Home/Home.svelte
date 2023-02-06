<script>
  import { onMount } from 'svelte'
  import store from '#store.js'
  import { dlg } from '#utils.js'
  import Modal from '../Modal.svelte'; let m0, m1, m2

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)
  const myQr = $store.myAccount.qr

  function er(msg) { 
    ({ m0, m1 } = dlg('Alert', msg, 'OK', () => m0 = false)); m0=m0; m1=m1
    store.setMsg(null)
  }

  onMount(async () => {
    store.setQr(null) // no going back to previous customer
    if ($store.erMsg) er($store.erMsg)
  })
</script>

<Modal m0={m0} on:m1={m1} on:m2={m2} />

<svelte:head>
  <title>CGPay</title>
</svelte:head>

<section id='home'>
  { #if  myQr }
    <div class="my-qr">
      <p>Show this code to PAY</p>
      <p><img src="{ myQr }" alt="my QR code" /></p>
    </div>
  { :else }
    <p>Ready to charge customers.</p>
  { /if }
  <div class="actions">
    <a href='/scan'>Scan to CHARGE</a>
  </div>
</section>

<style lang='stylus'>
  h1
    font-weight 600
    text lg

  section
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content space-between

  .my-qr p, img
    text-align center

  .actions
    width 100%

  a
    cgButton()
</style>
