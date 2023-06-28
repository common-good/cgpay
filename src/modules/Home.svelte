<script>
  import { onMount } from 'svelte'
  import st from'#store.js'
  import u from '#utils.js'
  import c from '#constants.js'
  import cgLogo from '#modules/assets/cg-logo-300-noR.png?webp'
  import Dashboard from './Dashboard.svelte'
  import ScanFake from './ScanFake.svelte'

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  const me = $st.me
  const hasTxOptions = ($st.allowShow || $st.allowType)
  const payBtnText = hasTxOptions ? 'Pay' : 'Scan to Pay'
  const chgBtnText = $st.selfServe ? 'Pay' : (hasTxOptions ? 'Charge' : 'Scan to Charge')
  let payOk
  let hdr = $st.selfServe ? 'Self Serve'
  : $st.showDash ? 'Dashboard'
  : $st.payOk ? 'Home'
  : 'Ready to Charge Someone'

  function showEr(msg) { u.alert(msg, () => { u.hide(); st.setMsg(null) }) }
  function fmtVersion(n) { n = n.toString(); return n.substring(0, 1) + '.' + n.substring(2, 3) + '.' + n.substring(3, 4) }

  function fake(code) { st.setQr(code); st.setIntent('charge'); u.go('tx') }

/*  const chgBtnText = () => {
    if (me.isCo && $st.selfServe) return 'Scan to Pay'
    if (me.isCo) return 'Scan to Charge'
    else return 'Charge'
  } */

  function pay() {
    if ($st.payOk == 'scan') { payOk = false; st.setCoPaying(false) } // scan-in is for just one payment
    tx('pay')
  }
  function charge() { tx('charge') }
  function tx(intent) { st.setIntent(intent); u.go(hasTxOptions ? 'tx-start' : 'scan') }

  function scanIn() {
    try {
      const card = u.qrParse($st.qr) // does not return if format is bad
      const mainId = u.getMainId($st.me.accountId)
      if (card.main != mainId) throw new Error('That is not a QR for this company.')
      st.setCoPaying(true)
    } catch (er) { showEr(u.qrEr(er)) }
  }

  // let hdr, qr, alt, btnPay, btnChg, payOk 
  // function isQrToPay() { return (qr.length == me.qr.length) }
  // /**
  //  * Set the displayed QR to a QR to pay or a QR to be paid
  //  * @param toPay: true for a QR to pay, false for a QR to be paid, null to toggle
  //  */
  // async function toggleQr(toPay = null) {
  //   if (typeof toPay === 'object') {
  //     if (!payOk) return
  //     toPay = !isQrToPay()
  //     if (!toPay && $st.coPay == 'scan') { st.setCoPaying(false); payOk = false; }
  //   }
  //   ;[qr, hdr, alt] = toPay ? [me.qr, 'Show this code to PAY', 'pay'] : [await receiveQr(), 'Show this code to BE PAID', 'be paid']
  //   if (me.isCo && !c.showToPay) hdr = payOk ? 'Ready to Charge or Pay' : 'Ready to Charge Someone'
  // }

  onMount(async () => {
    st.setTimeout(null) // stop the timeout timer from interrupting us
    st.setTrail(null, true)
    st.setLeft('logo')
    if ($st.frontCamera === null) st.setFrontCamera(!u.isApple() && !u.isAndroid())
    if ($st.intent == 'scanIn') scanIn() // must precede setQr
    st.setQr(null) // no going back to previous customer
    if ($st.erMsg) showEr($st.erMsg)

    payOk = (!me.isCo || $st.payOk == 'always' || $st.coPaying) && !$st.selfServe

    // if ($st.selfServe) {
    //   qr = await receiveQr()
    //   hdr = '<b>Self-Serve</b><br>Scan this code to pay with Common Good<br>Or press the button below to charge yourself'
    //   if (!c.showToPay) hdr = '<b>Self-Serve</b><br><br>Press the button below to scan your Common Good QR Code'
    //   alt = 'pay'
    // } else toggleQr(!me.isCo)

    // const intent = $st.intent
    // qr = intent === 'pay' ? $st.me?.qr : null
    // const qrAction = `Show this code to ${intent === 'pay' ? intent : 'be paid'}`
  })
</script>

<svelte:head>
  <title>CGPay - Home</title>
</svelte:head>

<section class="page" id="home">
  <div class="top">
    <h1 class="page-title {$st.showDash ? 'visuallyhidden' : null}" data-testid="header">{hdr}</h1>
    { #if me.isCo }
      { #if $st.selfServe}
        <p>Press the button below to scan your <br />Common Good QR Code</p>
      {/if}
      <div class='watermark'>
        <img class='logo' src= {cgLogo} alt='Common Good Logo' />
        <p>CGPay v{fmtVersion(c.version)}</p>
      </div>
    {:else}
      {#key $st.recentTxs}<Dashboard />{/key}
    {/if}
  </div>
  <div class="bottom">
    {#if u.localMode() && !hasTxOptions}
      {#if payOk}<ScanFake intent="pay"/>{/if}
      <ScanFake intent="charge"/>
    {/if}
    <div class="actions">
      {#if payOk }
        <button class="pay" data-testid="btn-pay" on:click={pay}>{payBtnText}</button>
      {/if}
      <button class="charge" data-testid="btn-charge" on:click={charge}>{chgBtnText}</button>
    </div>
  </div>
</section>

<style lang="stylus">
  button
    cgButton()
    width 100%

  .pay
    margin-right $s-1

  .fakes 
    display flex
    width 100%
    button
      cgButtonSecondary()
      padding 5px
      margin-bottom $s0
      flex-grow 1
      margin-right $s-2
      visibility visible

  p
    text-align center

  img 
    max-width 250px

  .survey
    cgButtonTertiary()

  .watermark
    opacity 0.5
    text-align center
    margin auto
    font-size $s-1

    img
      margin-bottom $s0
</style>
