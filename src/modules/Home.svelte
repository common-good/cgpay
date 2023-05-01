<script>
  import { onMount } from 'svelte'
  import store from '#store.js'
  import u from '#utils.js'
  import c from '#constants.js'
  import Modal from '#modules/Modal.svelte'; let m0, m1, m2
//  import cgLogo from '#modules/assets/cg-logo-300.png?webp'
  import { navigateTo } from 'svelte-router-spa'
  import queryString from 'query-string'

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  const surveyLink = 'https://forms.gle/M8Hv1W2oSgw2yQzS7'
  let me, myQr, isCo, self, coPay, coChg, hdr, qr, alt, btnPay

  function er(msg) { 
    ({ m0, m1 } = u.dlg('Alert', msg, 'Close', () => {m0 = false; store.setMsg(null)})); m0=m0; m1=m1
  }

  function receiveQR() { return u.generateQr(u.makeQrUrl(u.getMainId(me.accountId))) }
  function fake(code) { store.setQr(code); store.setIntent('charge'); navigateTo('/tx') }
  function pay() {
    if ($store.payOk == 'scan') { payOk = false; store.setCoPaying(false) }
    charge(store.selfServe() ? 'charge' : 'pay')
  }
  function charge(intent = 'charge') { store.setIntent(intent); navigateTo('/scan') }

  onMount(async () => {
    me = $store.myAccount
    myQr = me.qr
    isCo = me.isCo
    self = $store.selfServe
    coPay = (isCo && $store.coPaying)
    coChg = (isCo && !coPay)
    btnPay = self ? 'Or Scan Your Own QR Code to Pay'
    : isCo ? 'Scan to Pay / Refund / Receive Cash for Credit'
    : 'Scan a QR Code to Pay'

    ;([hdr, qr, alt] = !isCo ? ['Show this code to pay or be paid', myQr, 'pay or charge']
    : self ? ['Self-Serve Mode<br>Scan this code to pay ', receiveQR(), 'pay']
    : coPay ? ['Show this code to pay someone', myQr, 'charge']
    : ['Scan this code to pay ' + me.name, receiveQR(), 'pay'])

    if ($store.frontCamera === null) store.setFrontCamera(!u.isApple() && !u.isAndroid())
    store.setQr(null) // no going back to previous customer
    if (!coPay) store.setTimeout(null) // stop the timeout timer from interrupting us
    if ($store.erMsg) er($store.erMsg)
    try {
      const q = {deviceId:me.deviceId, actorId:me.accountId, lastTx:me.lastTx || -1 }
      const query = queryString.stringify(q)
      const { result } = await u.timedFetch(`latest?${ query }`)
    } catch (er) { if (!u.isTimeout(er)) console.log('latest er', er) }
  })

</script>

<Modal m0={m0} on:m1={m1} on:m2={m2} />

<svelte:head>
  <title>CGPay - Home</title>
</svelte:head>

<section class="page" id="home">
  <div class="top">
    <h1 data-testid="header">{@html hdr}</h1>
    <img src="{qr}" data-testid="qr" alt="Scan this QR Code to {alt + ' ' + me?.name}" />
    <p>CGPay v{c.version}</p>
  </div>

  <div class="charge">
    {#if u.localMode()}
      <div class="fakes">
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/KDCA12345a') }>A</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/KDCB12345b') }>B</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/LDCC098765a') }>C:A</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/LDCC198765b') }>C:B</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/LDCG098765f') }>G:F</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/LDCG398765f') }>Bad</button>
        <button on:click={ () => fake('garbage') }>Worse</button>
      </div>
    {/if}

    {#if !store.selfServe()}
      <!--a class="survey" data-testid="lnk-survey" href="{surveyLink}" target="_blank">Take Our User Experience Survey</a-->
    {/if}
    <div class="buttons">
      {#if coPay || !isCo}
        <button class="scan" data-testid="btn-pay" on:click={pay}>{btnPay}</button>
      {/if}
      {#if !self}
        <button class="scan" data-testid="btn-charge" on:click={charge}>Scan a QR Code to Charge</button>
      {/if}
    </div>
  </div>
</section>

<style lang="stylus">
  .fakes, .buttons
    display flex
    justify-content space-between

  .fakes button
    cgButtonSecondary()
    padding 5px
    margin-bottom $s0
    flex-grow 1
    margin-right $s-2

  .charge
    width 100%
    text-align center

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
    padding 0 $s-1
    color $c-blue
    text-decoration underline
    text-underline-offset 5px

  .scan
    cgButton()
    margin-top $s0
  
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
