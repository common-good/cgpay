<script lang="ts">
  import { onMount } from 'svelte'
  import QRCode from 'qrcode'
  import type { Device } from '$lib/app-shell'
  import { mainId, qrUrl } from './lib/qr'

  let { device, intent, onscan, phpBase }: { device: Device, intent: string, onscan: () => void, phpBase: string } = $props()
  const paying = intent === 'pay'
  let qr = $state('')

  // Paying, the member shows the card made for them; receiving, one that names just the account.
  onMount(async () => { qr = paying ? device.qr : await QRCode.toDataURL(qrUrl(mainId(device.accountId), device.real), { width: 310 }) })
</script>

<section class="page">
  <h1>Show to {paying ? 'Pay' : 'Receive'}</h1>
  {#if qr}<img data-testid="qr" src={qr} alt={paying ? 'Pay' : 'Receive'} />{/if}
  {#if paying}<p>Note: Only requests by an individual require confirmation.</p>{/if}
  <div class="btns">
    <button data-testid="btn-scan" onclick={onscan}>Scan to {paying ? 'Pay' : 'Charge'}</button>
    <a data-testid="btn-type" href="{phpBase}tx/{intent}">Type to {paying ? 'Pay' : 'Charge'}</a>
  </div>
</section>

<style>
  h1 { text-align: center; }
  img { display: block; margin: 0 auto; max-width: 100%; width: 260px; }
  p { text-align: center; font-size: 0.9rem; }
  .btns { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
  .btns a { text-align: center; padding: 14px; border-radius: 8px; border: 1px solid #1e7a3a; color: #1e7a3a; text-decoration: none; }
</style>
