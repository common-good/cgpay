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
  const chgBtnText = st.selfServe() ? 'Pay' : 'Charge'
  let payOk
  let hdr = st.selfServe() ? 'Self Serve'
  : $st.showDash ? 'Dashboard'
  : 'Home'

  let balance = ''
  let recents = []

  function showEr(msg) { u.alert(msg, () => { u.hide(); st.setMsg(null) }) }

  function pay() {
    if ($st.payOk == 'scan') { payOk = false; st.setCoPaying(false) } // scan-in is for just one payment
    tx('pay')
  }
  function charge() { tx('charge') }
  function tx(intent) { st.setIntent(intent); u.go($st.onlyScan ? 'scan' : 'startTx') }

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

    payOk = (!me.isCo || $st.payOk == 'always' || $st.coPaying) && c.showScanToPay && !st.selfServe()
  })

</script>

<svelte:head>
  <title>CGPay - Home</title>
</svelte:head>

<section class="page" id="home">
  <div class="top">
    <h1 data-testid="header">{hdr}</h1>
    {#if st.selfServe() || !$st.showDash }
      <!--p><b></b><br>Scan this code to pay with Common Good<br>Or press the button below to charge yourself</p-->
      <p>Press the button below to scan your Common Good QR Code</p>
      <div class='watermark'>
        <img class='logo' src= {cgLogo} alt='Common Good Logo' />
        <p>CGPay v{c.version}</p>
      </div>
    {:else}
      <Dashboard />
    {/if}
  </div>
  <div class="bottom">
    {#if me.isCo && !st.selfServe()}
      <a class="survey" data-testid="lnk-survey" href="{surveyLink}" target="_blank">Take Our User Survey</a>
    {/if}
    <div class="buttons">
      {#if payOk }
        <button class="pay" data-testid="btn-pay" on:click={pay}>Pay</button>
      {/if}
      <button class="charge" data-testid="btn-charge" on:click={charge}>{chgBtnText}</button>
    </div>
  </div>
</section>

<style lang="stylus">
  .buttons
    display flex
    justify-content space-between
    margin-top $s0

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

  .bottom
    width 100%
    text-align center

  .update p
    text-align center
    margin-bottom $s1

  h1
    text(lg)
    font-weight 400
    margin-bottom $s0
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
    cgButtonTertiary()

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
