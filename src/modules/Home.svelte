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
  const me = $store.myAccount
  let hdr, qr, alt, btnPay, payOk

  function showEr(msg) { 
    ({ m0, m1 } = u.dlg('Alert', msg, 'Close', () => {m0 = false; store.setMsg(null)})); m0=m0; m1=m1
  }

  async function receiveQr() { return await u.generateQr(u.makeQrUrl(u.getMainId(me.accountId))) }
  function fake(code) { store.setQr(code); store.setIntent('charge'); navigateTo('/tx') }
  function pay() {
    if ($store.payOk == 'scan') { payOk = false; store.setCoPaying(false) }
    charge(store.selfServe() ? 'charge' : 'pay')
  }
  function charge(intent = 'charge') { store.setIntent(intent); navigateTo('/scan') }
  function isQrToPay() { return (qr.length == me.qr.length) }

  /**
   * Set the displayed QR to a QR to pay or a QR to be paid
   * @param toPay: true for a QR to pay, false for a QR to be paid, null to toggle
   */
  async function toggleQr(toPay = null) {
    if (typeof toPay === 'object') {
      if (!payOk) return
      toPay = !isQrToPay()
      if (!toPay && $store.coPay == 'scan') { store.setCoPaying(false); payOk = false; }
    }
    ;[qr, hdr, alt] = toPay ? [me.qr, 'Show this code to PAY', 'pay'] : [await receiveQr(), 'Show this code to BE PAID', 'be paid']
  }

  function scanIn() {
    try {
      const card = u.qrParse($store.qr) // does not return if format is bad
      const mainId = u.getMainId($store.myAccount.accountId)
      if (card.main != mainId) throw new Error('That is not a QR for this company.')
      store.setCoPaying(true)
    } catch (er) { showEr(u.qrEr(er)) }
  }

  onMount(async () => {
    store.setTimeout(null) // stop the timeout timer from interrupting us
    if ($store.frontCamera === null) store.setFrontCamera(!u.isApple() && !u.isAndroid())
    if ($store.intent == 'scanIn') scanIn() // must precede setQr
    store.setQr(null) // no going back to previous customer
    if ($store.erMsg) showEr($store.erMsg)

    payOk = !me.isCo || $store.payOk == 'always' || $store.coPaying
    btnPay = me.isCo ? 'Scan to Pay / Refund / Sell CG Credit' : 'Scan to Pay'

    if (store.selfServe()) {
      qr = await receiveQr()
      hdr = '<b>Self-Serve</b><br>Scan this code to pay with Common Good<br>Or press the button below to charge yourself'
      alt = 'pay'
    } else toggleQr(!me.isCo)

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
    <button on:click={toggleQr}>
      <img src="{qr}" data-testid="qr" alt="Scan this QR Code to {alt + ' ' + me?.name}" />
    </button>
    <p>CGPay v{c.version}</p>
  </div>

  <div class="bottom">
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
      {#if payOk }
        <button class="scan pay" data-testid="btn-pay" on:click={pay}>{btnPay}</button>
      {/if}
      <button class="scan charge" data-testid="btn-charge" on:click={charge}>Scan to Charge</button>
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
    visibility visible

  .bottom
    width 100%
    text-align center

  .update p
    text-align center
    margin-bottom $s1

  h1
    text(lg)
    font-weight 400
    margin-bottom $s2
    text-align center

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

  .pay
    cgButtonSecondary()
    margin-top $s0
    margin-right $s-2

  .charge
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
