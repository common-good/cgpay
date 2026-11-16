<script lang="ts">
  import { onMount } from 'svelte'
  import type { Device } from '$lib/app-shell'
  import { identity, idPhoto, type Identity } from './lib/api'
  import { mainId, parseQr } from './lib/qr'

  let { device, intent, qr, onfail }: { device: Device, intent: string, qr: string, onfail: (msg: string) => void } = $props()
  const paying = intent === 'pay'
  let who = $state<Identity | null>(null)
  let photo = $state('')

  // The other account's profile. Anything wrong with the scanned code sends the member back to the dashboard with the reason.
  onMount(async () => {
    try {
      const card = parseQr(qr, device.real)
      if (!paying && !card.code) throw new Error('That QR is for payments only.')
      if (card.main === mainId(device.accountId)) throw new Error('That QR is for the same account as yours.')
      who = await identity(device, card)
      if (who.limit <= 0) throw new Error('This account has no remaining funds, so a transaction is not possible at this time.')
      if (!paying) photo = await idPhoto(device, card)
    } catch (er) {
      const m = (er as Error).message
      onfail(m === '404' ? 'That is not a valid Common Good member QR Code.' : isNaN(+m) ? m : "An unexpected error occurred. Please alert Common Good's support team.")
    }
  })
</script>

<section class="page">
  <h1>{paying ? 'Pay' : 'Charge'}</h1>
  {#if who}
    <section data-testid="charge-profile">
      {#if photo}<img data-testid="theirPhoto" src={photo} alt="Customer Profile" />{/if}
      {#if who.agent}
        <h2 data-testid="theirAgent">{who.agent}</h2>
        <p data-testid="theirCompany">{who.name}</p>
      {:else}
        <h2 data-testid="theirName">{who.name}</h2>
      {/if}
      <p data-testid="theirLocation">{who.location}</p>
    </section>
  {/if}
</section>

<style>
  h1, h2, p, section[data-testid] { text-align: center; }
  img { width: 120px; }
</style>
