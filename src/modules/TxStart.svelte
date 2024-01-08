<script>
  /**
   * Start a transaction (either a payment or a charge).
   * Offer these options:
   * - show a QR
   * - type the person's identifier
   * - scan the person's QR
   * Expect $st.intent to be "pay" or "charge"
   */
  import { onMount } from 'svelte'
  import st from'#store.js'
  import u from '#utils.js'
  import c from '#constants.js'
  import ScanFake from './ScanFake.svelte'

  const me = $st.me
  const paying = ($st.intent == 'pay')
  let qr, btnPay, payOk
  let qrAction

  function scan() { u.go('scan') }
  async function receiveQr() { return await u.generateQr(u.makeQrUrl(u.getMainId($st.me.accountId))) }

  onMount(async () => {
    if ($st.allowShow) [qr, qrAction] = paying ? [me.qr, 'Pay'] : [await receiveQr(), 'Receive']
    payOk = (!me.isCo || $st.payOk == 'always' || $st.coPaying) && c.showScanToPay
    btnPay = me.isCo ? 'Pay / Refund / Sell CG Credit' : 'Pay'
  })

</script>

<svelte:head>
  <title>CGPay - Start Transaction</title>
</svelte:head>

<section class="page" id="tx-start">
  <div class="top">
    <h1 class="page-title">Show to {qrAction}</h1>
    <div class="img">
      <img class="qr-{$st.intent}" src="{qr}" data-testid="qr" alt={qrAction} />
    </div>
    <p>CGPay v{u.fmtVersion(c.version)}</p>
    {#if paying}<p>Note: Only requests by an individual require confirmation.</p>{/if}
  </div>
  {#if u.localMode() && !u.testing()}<ScanFake intent={$st.intent}/>{/if}
  <div class="bottom">
    <button class="primary" data-testid="btn-scan" on:click={scan}>
      Scan to {paying ? btnPay : 'Charge'}
    </button>
  </div>
</section>

<style lang='stylus'>
  button
    text-transform capitalize

  h1 
    text-transform capitalize

  p 
    margin 0 auto $s1 auto
    text(sm)
    text-align center
    max-width 340px

  .icon
    margin-right $s-1

  .img
    display flex
    flex 0 1 40vh

  img
    max-width 130%
    height 100%
    position:relative;
    left: 50%;
    transform: translateX(-50%);
    width: auto;
    
</style>
