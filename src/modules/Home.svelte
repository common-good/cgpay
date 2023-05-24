<script>
  import { onMount } from 'svelte'
  import st from'#store.js'
  import u from '#utils.js'
  import c from '#constants.js'
  import cgLogo from '#modules/assets/cg-logo-300-noR.png?webp'
  import Dashboard from './Dashboard.svelte';

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  const surveyLink = 'https://forms.gle/HKb5V4DueYt1W13v6'
  const me = $st.myAccount
  let hdr, qr, btnPay, btnChg, payOk

  function showEr(msg) { u.alert(msg, () => { u.hide(); st.setMsg(null) }) }

  async function receiveQr() { return await u.generateQr(u.makeQrUrl(u.getMainId(me.accountId))) }
  function fake(code) { st.setQr(code); st.setIntent('charge'); u.go('tx-details') }
  function handleClick(intent) {
    if ($st.payOk == 'scan') { payOk = false; st.setCoPaying(false) }

    st.setIntent(intent)

    const nextPage = me.isCo ? 'scan' : 'tx';
    u.go(nextPage)
  }

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
    if (!c.showToPay) hdr = payOk ? 'Ready to Charge or Pay' : 'Ready to Charge Someone'
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

    payOk = !me.isCo || ($st.payOk == 'always' || $st.coPaying) && c.showScanToPay
    btnPay = me.isCo ? 'Scan to Pay / Refund / Sell CG Credit' : 'Pay'
    switch (me.isCo) {
      case true:
        btnChg = st.selfServe() ? 'Scan to Pay' : 'Scan to Charge'
        break
      case false:
        btnChg = 'Charge'
        break
    }

    if (!me.isCo) {
      qr = me.qr
      hdr = 'Show this code to pay'
    } else if (st.selfServe()) {
      qr = await receiveQr()
      hdr = '<b>Self-Serve</b><br>Scan this code to pay with Common Good<br>Or press the button below to charge yourself'
      if (!c.showToPay) hdr = '<b>Self-Serve</b><br><br>Press the button below to scan your Common Good QR Code'
    } else {
      hdr = 'Ready to charge someone'
    }

    try {
      const info = {deviceId:me.deviceId, actorId:me.accountId, lastTx:me.lastTx || -1 }
      const res = await u.postRequest('latest', info)
    } catch (er) { if (!u.isTimeout(er)) console.log('latest er', er) }
  })

</script>

<svelte:head>
  <title>CGPay - Home</title>
</svelte:head>

<section class="page" id="home">
  <div class="top">
    {#if !me.isCo} 
    <Dashboard />
    {:else}
    <h1 class="page-title" data-testid="header">{@html hdr}</h1>
      {#if c.showShowToPay || !me.isCo}
        <button on:click={toggleQr}>
          <img src="{qr}" data-testid="qr" alt="Scan this QR Code to {alt + ' ' + me?.name}" />
        </button>
        <p>CGPay v{c.version}</p>
      {:else}
        <div class='watermark'>
          <img class='logo' src= { cgLogo } alt='Common Good Logo' />
          <p>CGPay v{c.version}</p>
        </div>
      { /if }
    { /if }
  </div>
  <div class="bottom">
    {#if u.localMode() }
      <div class="actions fakes">
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/KDCA12345a') }>A</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/KDCB12345b') }>B</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/LDCC098765a') }>C:A</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/LDCC198765b') }>C:B</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/LDCG098765f') }>G:F</button>
        <button on:click={ () => fake('HTTP://6VM.RC4.ME/LDCG398765f') }>Bad</button>
        <button on:click={ () => fake('garbage') }>Worse</button>
      </div>
    {/if}
    {#if me.isCo && !st.selfServe()}
      <a class="survey" data-testid="lnk-survey" href="{surveyLink}" target="_blank">Take Our User Survey</a>
    {/if}
    <div class="actions">
      {#if payOk }
        <button class="pay" data-testid="btn-pay" on:click={() => handleClick('pay')}>{btnPay}</button>
      {/if}
      <button class="charge" data-testid="btn-charge" on:click={() => handleClick('charge')}>{btnChg}</button>
    </div>
  </div>
</section>

<style lang="stylus">
  button
    cgButton()
    width 100%

  .pay
    margin-right $s-1

  .fakes button
    cgButtonSecondary()
    padding 5px
    margin-bottom $s0
    flex-grow 1
    margin-right $s-2
    visibility visible

  .update p
    text-align center
    margin-bottom $s1

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
