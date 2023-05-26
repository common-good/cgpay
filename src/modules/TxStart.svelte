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
  import QrIcon from "svelte-material-icons/QrcodeScan.svelte"

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  const intent = $st.intent
  let qr = intent === 'pay' ? $st.myAccount?.qr : null;
  const qrAction = `Show this code to ${intent === 'pay' ? intent : 'charge someone'}`

  const handleClick = () => { u.go('scan') }

  async function receiveQr() { return await u.generateQr(u.makeQrUrl(u.getMainId($st.myAccount.accountId))) }

  onMount(async () => {
    if (intent === 'charge') qr = await receiveQr()
  })

</script>

<svelte:head>
  <title>CGPay - Start Transaction</title>
</svelte:head>

<section class="page" id="tx-start">
  <div class="top">
    <h1 class="page-title">{intent}</h1>
    <p>{qrAction}</p>
    <img src="{qr}" data-testid="qr" alt={qrAction} />
  </div>
  <div class="bottom">
    <button on:click={handleClick} class="primary">
      <span class="icon">
        <QrIcon size="1.5rem" />
      </span>
      Scan to {intent}</button>
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
