<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'
  import { goto } from '$app/navigation'

  const balance = 1248.75
  const linkedBank = { label: 'Wells Fargo · ····4912', limit: 5000 }

  type Direction = 'to-bank' | 'from-bank'
  let direction = $state<Direction>('from-bank')

  let amount = $state('')
  let success = $state(false)

  const max = $derived(
    direction === 'to-bank' ? Math.min(balance, linkedBank.limit) : linkedBank.limit
  )

  const amountValid = $derived(Number(amount) > 0 && Number(amount) <= max)
  const ready = $derived(amountValid)

  function submit() {
    if (!ready) return
    success = true
    setTimeout(() => goto('/preview/dashboard-simple'), 1500)
  }

  function fmt(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
</script>

<div class="page">
  <header class="topbar">
    <a class="back" href="/preview/dashboard-simple" aria-label="Back">
      <Icon name="arrow" size={18} class="back-arrow" />
    </a>
    <h1>Transfer</h1>
    <span class="bal-pill">Balance · ${fmt(balance)}</span>
  </header>

  {#if success}
    <div class="success" role="status">
      <div class="check"><Icon name="check" size={28} /></div>
      <h2>Transfer requested</h2>
      <p>${fmt(Number(amount))} {direction === 'to-bank' ? 'to' : 'from'} {linkedBank.label}</p>
      <span class="muted">May take up to 4 business days. We'll email when it clears.</span>
    </div>
  {:else}
    <section class="card direction-card">
      <div class="dir-options">
        <button
          class:active={direction === 'from-bank'}
          onclick={() => (direction = 'from-bank')}
        >
          <span class="dir-row">
            <span class="dir-icon"><Icon name="download" size={18} /></span>
            <span>
              <span class="dir-label">From bank</span>
              <span class="dir-sub">Add funds to your Common Good account</span>
            </span>
          </span>
        </button>
        <button
          class:active={direction === 'to-bank'}
          onclick={() => (direction = 'to-bank')}
        >
          <span class="dir-row">
            <span class="dir-icon"><Icon name="upload" size={18} /></span>
            <span>
              <span class="dir-label">To bank</span>
              <span class="dir-sub">Send funds from Common Good to your bank</span>
            </span>
          </span>
        </button>
      </div>
    </section>

    <section class="card">
      <h2>How much?</h2>
      <div class="amount-row">
        <span class="currency">$</span>
        <input type="text" inputmode="decimal" placeholder="0.00" bind:value={amount} />
      </div>
      <div class="limit-row">
        <span class="muted">Available · ${fmt(max)}</span>
        <button class="link" onclick={() => (amount = String(max.toFixed(2)))}>Use max</button>
      </div>
      {#if amount && Number(amount) > max}
        <p class="warn">Amount exceeds the daily limit ({direction === 'to-bank' ? 'ACH out' : 'ACH in'}).</p>
      {/if}
    </section>

    <section class="card bank-card">
      <h2>Bank account</h2>
      <div class="bank-row">
        <span class="bank-icon"><Icon name="bank" size={18} /></span>
        <div>
          <span class="bank-label">{linkedBank.label}</span>
          <span class="bank-sub">Linked via Plaid</span>
        </div>
        <button class="link">Change</button>
      </div>
    </section>

    <p class="timing-note">
      <Icon name="clock" size={14} />
      Bank transfers may take up to 4 business days (3 if you submit before 2 pm Eastern).
      If you need funds urgently, contact us.
    </p>

    <button class="tr-btn" disabled={!ready} onclick={submit}>
      {ready
        ? `${direction === 'to-bank' ? 'Send to bank' : 'Add from bank'} · $${fmt(Number(amount))}`
        : `${direction === 'to-bank' ? 'Send to bank' : 'Add from bank'}`}
    </button>
  {/if}
</div>

<style>
  .page { max-width: 540px; margin: 0 auto; padding: 1rem 1.25rem 2.5rem; display: grid; gap: 1rem; }

  .topbar { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.85rem; padding: 0.25rem 0 0.5rem; }
  .back { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: 50%; background: var(--cg-surface); border: 1px solid var(--cg-border); text-decoration: none; }
  .back:hover { border-color: var(--cg-green); }
  :global(.back-arrow) { transform: rotate(180deg); color: var(--cg-text); }
  .topbar h1 { margin: 0; font-size: 1.15rem; font-weight: 600; }
  .bal-pill { font-size: 0.78rem; color: var(--cg-text-muted); background: var(--cg-surface); border: 1px solid var(--cg-border); padding: 0.3rem 0.7rem; border-radius: 999px; }

  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); padding: 1.1rem 1.2rem; }
  .card h2 { margin: 0 0 0.85rem; font-size: 0.9rem; font-weight: 600; color: var(--cg-text); }

  /* Direction selector */
  .direction-card { padding: 0.4rem; }
  .dir-options { display: grid; gap: 0.25rem; }
  .dir-options button { width: 100%; text-align: left; padding: 0.85rem 1rem; background: transparent; border: none; border-radius: var(--cg-radius-sm); cursor: pointer; font-family: inherit; color: var(--cg-text); }
  .dir-options button:hover { background: var(--cg-bg); }
  .dir-options button.active { background: rgba(30,122,58,0.08); }
  .dir-row { display: grid; grid-template-columns: auto 1fr; gap: 0.85rem; align-items: center; }
  .dir-icon { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: var(--cg-bg); color: var(--cg-text-muted); display: grid; place-items: center; }
  .dir-options button.active .dir-icon { background: rgba(30,122,58,0.12); color: var(--cg-green); }
  .dir-label { display: block; font-weight: 600; font-size: 0.95rem; }
  .dir-sub { display: block; font-size: 0.8rem; color: var(--cg-text-muted); margin-top: 0.1rem; }

  /* Amount */
  .amount-row { display: flex; align-items: baseline; gap: 0.5rem; padding: 0.25rem 0; }
  .currency { font-size: 2rem; color: var(--cg-text-muted); font-weight: 500; }
  .amount-row input { flex: 1; border: none; outline: none; background: transparent; font-size: 2.6rem; font-weight: 600; letter-spacing: -0.02em; color: var(--cg-text); font-variant-numeric: tabular-nums; min-width: 0; }
  .limit-row { display: flex; justify-content: space-between; align-items: center; margin-top: 0.4rem; padding-top: 0.6rem; border-top: 1px solid var(--cg-border); font-size: 0.82rem; }
  .muted { color: var(--cg-text-muted); }
  .link { background: transparent; border: none; cursor: pointer; color: var(--cg-green); font-weight: 500; font-size: 0.85rem; padding: 0.15rem 0.4rem; }
  .link:hover { text-decoration: underline; }
  .warn { margin: 0.5rem 0 0; font-size: 0.85rem; color: var(--cg-error); }

  /* Bank */
  .bank-row { display: grid; grid-template-columns: auto 1fr auto; gap: 0.85rem; align-items: center; padding: 0.4rem 0; }
  .bank-icon { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: var(--cg-bg); color: var(--cg-text); display: grid; place-items: center; }
  .bank-label { display: block; font-weight: 500; font-size: 0.92rem; }
  .bank-sub { display: block; font-size: 0.78rem; color: var(--cg-text-muted); margin-top: 0.1rem; }

  /* Timing note */
  .timing-note { margin: 0; padding: 0.75rem 1rem; background: var(--cg-bg); border-radius: var(--cg-radius-sm); font-size: 0.82rem; color: var(--cg-text-muted); line-height: 1.4; display: flex; gap: 0.5rem; align-items: flex-start; }
  .timing-note :global(svg) { flex-shrink: 0; margin-top: 0.15rem; }

  /* Submit */
  .tr-btn { width: 100%; padding: 1.1rem; background: #b96e0c; color: white; border: none; border-radius: var(--cg-radius); font-size: 1.05rem; font-weight: 600; cursor: pointer; transition: background 0.15s; font-variant-numeric: tabular-nums; }
  .tr-btn:hover:not(:disabled) { background: #a05f0a; }
  .tr-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .success { display: grid; place-items: center; gap: 0.4rem; padding: 2.5rem 1.5rem; text-align: center; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }
  .check { width: 4rem; height: 4rem; border-radius: 50%; background: rgba(214,143,30,0.1); color: #b96e0c; display: grid; place-items: center; margin-bottom: 0.5rem; }
  .success h2 { margin: 0; font-size: 1.2rem; font-weight: 600; }
  .success p { margin: 0; font-size: 1rem; font-weight: 500; }
  .success .muted { font-size: 0.85rem; margin-top: 0.4rem; max-width: 280px; }
</style>
