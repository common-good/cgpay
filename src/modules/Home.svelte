<script>
  import { onMount } from 'svelte'
  import store from '#store.js'
  import u from '#utils.js'
  import c from '#constants.js'
  import Modal from '#modules/Modal.svelte'; let m0, m1, m2
  import cgLogo from '#modules/assets/cg-logo-300.png?webp'
  import { navigateTo } from 'svelte-router-spa'
  import queryString from 'query-string'

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  const myQr = $store.myAccount?.qr

  function er(msg) { 
    ({ m0, m1 } = u.dlg('Alert', msg, 'Close', () => {m0 = false; store.setMsg(null)})); m0=m0; m1=m1
  }

  function fake(code) {
    store.setQr(code)
    navigateTo('/charge')
  }

  onMount(async () => {
    if ($store.frontCamera == null) store.setFrontCamera(!u.isApple() && !u.isAndroid())
    store.setQr(null) // no going back to previous customer
    if ($store.erMsg) er($store.erMsg)
    if ($store.myAccount) try {
      const q = {deviceId:$store.myAccount.deviceId, actorId:$store.myAccount.accountId, lastTx:$store.myAccount.lastTx || -1 }
      const query = queryString.stringify(q)
      const { result } = await u.timedFetch(`latest?${ query }`)
    } catch (er) { if (!u.isTimeOut(er)) console.log('latest er', er) }
  })
</script>

<Modal m0={m0} on:m1={m1} on:m2={m2} />

<svelte:head>
  <title>CGPay - Home</title>
</svelte:head>

<section class="page" id="home">
  { #if myQr }
    <div class='top'>
      <h1>Show this code to pay</h1>
      <img src="{ myQr }" data-testid='qr' alt="my QR code" />
      <p>CGPay v{ c.version }</p>
    </div>
  { :else }
    <div class='top business'>
      { #if $store.selfServe }
        <h1>Self-Serve Mode</h1>
      { :else }
        <h1>Ready to charge people.</h1>
      { /if }
      <div class='watermark'>
        <img class='logo' src= { cgLogo } alt='Common Good Logo' />
        <p>CGPay v{ c.version }</p>
      </div>
    </div>
  { /if }

  <div class="charge">
    { #if u.localMode() }
      <div class="fakes">
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/KDCA12345a') }>A</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/KDCB12345b') }>B</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/LDCC098765a') }>C:A</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/LDCC198765b') }>C:B</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/LDCG098765f') }>G:F</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/LDCG398765f') }>Bad</button>
        <button on:click={ () => fake('garbage') }>Worse</button>
      </div>
    { /if }
    <!-- Scan feature disabled for A Release -->
    <a class="scan-customer" data-testid="btn-charge" href='/scan'>Scan QR Code to Charge</a>
    <!-- a class="survey" data-testid="lnk-survey" href="https://forms.gle/M8Hv1W2oSgw2yQzS7" target="_blank">Take Our User Experience Survey</a -->
  </div>
</section>

<style lang='stylus'>
  a
    cgButton()
    width 100%

  .fakes
    display flex
    justify-content space-between
    overflow-x scroll

  .fakes button
    cgButtonSecondary()
    padding 5px
    margin-bottom $s0
    flex-grow 1
    margin-right $s-2

  .charge
    width 100%

  .update p
    text-align center
    margin-bottom $s1

  h1
    text(lg)
    font-weight 400
    margin-bottom $s2

  img 
    max-width 250px

  section
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content space-between

  .survey
    cgButtonSecondary()

  .top
    width 100%
    height 100%
    display flex
    flex-direction column
    align-items center

  .watermark
    opacity 0.5
    text-align center
    margin auto
    font-size $s-1

    img
      margin-bottom $s0
</style>
