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
  import cgLogo from '#modules/assets/cg-logo-300-noR.png?webp'
  import QrIcon from "svelte-material-icons/QrcodeScan.svelte"
  import ScanFake from './ScanFake.svelte'

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  const me = $st.myAccount
  const paying = ($st.intent == 'pay')
  let hdr = paying ? 'Pay' : 'Charge / Request Payment'
  let qr, btnPay, btnChg, payOk
  let qrAction

  const intent = $st.intent

  function scan() { u.go('scan') }
  async function receiveQr() { return await u.generateQr(u.makeQrUrl(u.getMainId($st.myAccount.accountId))) }

  onMount(async () => {
    if ($st.allowShow) [qr, qrAction] = paying ? [me.qr, 'pay'] : [await receiveQr(), 'be paid']
    payOk = (!me.isCo || $st.payOk == 'always' || $st.coPaying) && c.showScanToPay
    btnPay = me.isCo ? 'Pay / Refund / Sell CG Credit' : 'Pay'
  })

</script>

<svelte:head>
  <title>CGPay - Start Transaction</title>
</svelte:head>

<section class="page" id="tx-start">
  <div class="top">
    <h1 class="page-title">Show this code to {qrAction}</h1>
    <img src="{qr}" data-testid="qr" alt={qrAction} />
  </div>
  <div class="bottom">
    <ScanFake intent={$st.intent}/>
    <button class="primary" data-testid="btn-scan" on:click={scan}>
      <span class="icon">
        <QrIcon size="1.5rem" />
      </span>
      Scan to {paying ? btnPay : 'Charge'}
    </button>
  </div>
</section>

<style lang='stylus'>
  button
    text-transform capitalize

  h1 
    text-transform capitalize

  img
    min-height 300px

  p 
    margin-bottom $s0

  .icon
    margin-right $s-1
</style>
