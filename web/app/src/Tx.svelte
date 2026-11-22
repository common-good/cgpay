<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { Device } from '$lib/app-shell'
  import { identity, idPhoto, unreachable, type Identity } from './lib/api'
  import { mainId, parseQr, type Card } from './lib/qr'
  import { cachePhoto, cacheProfile, checkAmount, enqueue, flush, makeTx, money, offlinePhoto, offlineProfile, unqueue, type Tx } from './lib/tx'
  import { shrink } from './lib/photo'

  let { device, intent, qr, onfail, onrescan, ondone }: { device: Device, intent: string, qr: string, onfail: (msg: string) => void, onrescan: () => void, ondone: (msg?: string, offline?: boolean) => void } = $props()
  const paying = intent === 'pay'
  let who = $state<Identity | null>(null)
  let photo = $state('')
  let card: Card
  let amount = $state<number | null>(null)
  let description = $state('')
  let dialog = $state<{ text: string, yes?: () => void, no?: () => void } | null>(null)
  let sent = $state<{ tx: Tx, key: string } | null>(null)
  let timer: ReturnType<typeof setTimeout>
  const TIMEOUT_S = +(import.meta.env.VITE_TX_TIMEOUT_S || 10)

  // With nobody doing anything, the summary finishes itself, so a payment is not undone by accident.
  const arm = () => { clearTimeout(timer); timer = setTimeout(done, TIMEOUT_S * 1000) }

  const alert = (text: string) => dialog = { text, yes: () => dialog = null }
  onDestroy(() => clearTimeout(timer))
  const word = paying ? 'Pay' : 'Charge'

  async function submit(e: Event) {
    e.preventDefault()
    const [a, err] = checkAmount(amount ?? 0, who!.limit)
    amount = a
    if (err) return alert(err)
    const tx = await makeTx(device, card, paying, a, description)
    try { sent = { tx, key: await enqueue(tx) } } catch { return alert('This phone is out of space, so the transaction could not be saved. Free some space on the phone and try again.') }
    arm()
  }

  const askUndo = () => {
    clearTimeout(timer)
    dialog = {
      text: 'Reverse the transaction?',
      yes: async () => { await unqueue(sent!.key); ondone('The transaction has been reversed.') },
      no: () => { dialog = null; arm() }
    }
  }

  /** The Back button: on the summary it means undo, before that it returns to the scanner. */
  export function back() { if (sent) askUndo(); else onrescan() }

  // Sending waits for Done, so that Undo can still take the transaction back before the server has it.
  async function done() { clearTimeout(timer); let off = false; try { off = await flush(device) } finally { ondone('', off) } }

  // The other account's profile. Anything wrong with the scanned code sends the member back to the dashboard with the reason.
  onMount(async () => {
    try {
      card = parseQr(qr, device.real)
      if (!paying && !card.code) throw new Error('That QR is for payments only.')
      if (card.main === mainId(device.accountId)) throw new Error('That QR is for the same account as yours.')
      try {
        const found = await identity(device, card)
        await cacheProfile(card, found)
        who = found
      } catch (er) {
        if (!unreachable(er)) throw er
        who = await offlineProfile(card)
        if (!paying) photo = await offlinePhoto(card)
        if (!photo) alert('OFFLINE. Trust this member or ask for ID.') // with a photo, the cashier can check the face
        return
      }
      if (who.limit <= 0) throw new Error('This account has no remaining funds, so a transaction is not possible at this time.')
      description = who[paying ? 'selling' : 'isell']?.[0] ?? ''
      if (!paying) {
        const b = await idPhoto(device, card)
        photo = URL.createObjectURL(b)
        shrink(b).then(jpeg => cachePhoto(card, jpeg), () => {}) // a photo that cannot be made smaller is only not kept
      }
    } catch (er) {
      const m = (er as Error).message
      onfail(m === '404' ? 'That is not a valid Common Good member QR Code.' : isNaN(+m) ? m : "An unexpected error occurred. Please alert Common Good's support team.")
    }
  })
</script>

<section class="page">
  {#if sent}
    <h1 data-testid="tx-summary">Transaction Summary</h1>
    <p><span data-testid="action">{paying ? 'Paid' : 'Charged'}</span> to:</p>
    {#if who?.agent}<p data-testid="agent">{who.agent}</p>{/if}
    <p data-testid="other-name">{who?.name || 'Unidentified Member'}</p>
    <p>Description: <span data-testid="description">{sent.tx.description}</span></p>
    <p>Amount: $<span data-testid="amount">{money(Math.abs(+sent.tx.amount))}</span></p>
    <p class="note" data-testid="thank-you">Thank you for using CGPay for democracy and the common good!</p>
    <button class="plain" data-testid="btn-undo" onclick={askUndo}>Undo</button>
    <button data-testid="btn-done" onclick={done}>Done</button>
  {:else if who}
    <h1 data-testid="action">{word}</h1>
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
    <form onsubmit={submit}>
      <label for="amount">Amount</label>
      <input id="amount" data-testid="input-amount" type="number" step="any" placeholder="$0.00" bind:value={amount} required />
      <label for="description">Description</label>
      <input id="description" data-testid="input-description" type="text" placeholder="e.g. lunch, rent, supplies, loan, etc." bind:value={description} required />
      <button data-testid="btn-submit" type="submit">{word}</button>
    </form>
  {/if}
</section>

{#if dialog}
  <div class="back"></div>
  <div class="dialog" role="dialog" aria-modal="true">
    <p data-testid="messageText">{dialog.text}</p>
    <button data-testid="btn1" onclick={dialog.yes}>{dialog.no ? 'Yes' : 'OK'}</button>
    {#if dialog.no}<button class="plain" data-testid="btn2" onclick={dialog.no}>No</button>{/if}
  </div>
{/if}

<style>
  h1, h2, p, section[data-testid] { text-align: center; }
  img { width: 120px; }
  form { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
  input { font: inherit; padding: 12px; border: 1px solid #9aa39d; border-radius: 8px; }
  button.plain { background: none; border: 1px solid #1e7a3a; color: #1e7a3a; }
  .note { font-size: 0.8rem; border-top: 1px dashed; padding-top: 8px; }
  .back { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.3); }
  .dialog { position: fixed; left: 16px; right: 16px; top: 30%; max-width: 440px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
</style>
