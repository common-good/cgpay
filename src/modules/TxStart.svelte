<script>
  /**
   * Start a transaction (either a payment or a charge).
   * Offer these options:
   * - show a QR
   * - type the person's identifier
   * - scan the person's QR
  */
  import { onMount } from 'svelte'
  import st from'#store.js'
  import u from '#utils.js'
  import c from '#constants.js'
  import cgLogo from '#modules/assets/cg-logo-300-noR.png?webp'

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  const surveyLink = 'https://forms.gle/HKb5V4DueYt1W13v6'
  const me = $st.myAccount
  let hdr, qr, alt, btnPay, btnChg, payOk

  function showEr(msg) { u.alert(msg, () => { u.hide(); st.setMsg(null) }) }

  async function receiveQr() { return await u.generateQr(u.makeQrUrl(u.getMainId(me.accountId))) }
  function fake(code) { st.setQr(code); st.setIntent('charge'); u.go('tx') }
  function pay() {
    if ($st.payOk == 'scan') { payOk = false; st.setCoPaying(false) }
    charge('pay')
  }
  function charge(intent = 'charge') { st.setIntent(intent); u.go('scan') }
  function isQrToPay() { return (qr.length == me.qr.length) }

  /**
   * Set the displayed QR to a QR to pay or a QR to be paid
   * @param toPay: true for a QR to pay, false for a QR to be paid, null to toggle
   */
  async function toggleQr(toPay = null) {
    if (typeof toPay === 'object') {
      if (!payOk) return
      toPay = !isQrToPay()
      if (!toPay && $st.coPay == 'scan') { st.setCoPaying(false); payOk = false; }
    }
    ;[qr, hdr, alt] = toPay ? [me.qr, 'Show this code to PAY', 'pay'] : [await receiveQr(), 'Show this code to BE PAID', 'be paid']
    if (me.isCo && !c.showToPay) hdr = payOk ? 'Ready to Charge or Pay' : 'Ready to Charge Someone'
  }

  function scanIn() {
    try {
      const card = u.qrParse($st.qr) // does not return if format is bad
      const mainId = u.getMainId($st.myAccount.accountId)
      if (card.main != mainId) throw new Error('That is not a QR for this company.')
      st.setCoPaying(true)
    } catch (er) { showEr(u.qrEr(er)) }
  }

  onMount(async () => {
    st.setTimeout(null) // stop the timeout timer from interrupting us
    st.setTrail(null, true)
    st.setLeft('logo')
    if ($st.frontCamera === null) st.setFrontCamera(!u.isApple() && !u.isAndroid())
    if ($st.intent == 'scanIn') scanIn() // must precede setQr
    st.setQr(null) // no going back to previous customer
    if ($st.erMsg) showEr($st.erMsg)

    payOk = (!me.isCo || $st.payOk == 'always' || $st.coPaying) && c.showScanToPay
    btnPay = me.isCo ? 'Scan to Pay / Refund / Sell CG Credit' : 'Scan to Pay'
    btnChg = st.selfServe() ? 'Scan to Pay' : 'Scan to Charge'

    if (st.selfServe()) {
      qr = await receiveQr()
      hdr = '<b>Self-Serve</b><br>Scan this code to pay with Common Good<br>Or press the button below to charge yourself'
      if (!c.showToPay) hdr = '<b>Self-Serve</b><br><br>Press the button below to scan your Common Good QR Code'
      alt = 'pay'
    } else toggleQr(!me.isCo)

    const intent = $st.intent
    const qr = intent === 'pay' ? $st.myAccount?.qr : null
    const qrAction = `Show this code to ${intent === 'pay' ? intent : 'be paid'}`
  })

</script>

<svelte:head>
  <title>CGPay - Home</title>
</svelte:head>

<section class="page" id="tx-start">
  <div class="top">
    <h1>{intent}</h1>
    <p>{qrAction}</p>
    <img src="{qr}" data-testid="qr" alt={qrAction} />
  </div>
  <div class="bottom">
    <button>Scan to {intent}</button>
  </div>
</section>

<style lang='stylus'>
  button
    cgButton()
    text-transform capitalize

  h1 
    text-transform capitalize

  img
    min-height 300px

  section
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content space-between

  .top
    width 100%
    height 100%
    display flex
    flex-direction column
    align-items center

  .bottom
    width 100%
    text-align center
</style>
