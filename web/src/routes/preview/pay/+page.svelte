<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'
  import { goto } from '$app/navigation'

  const balance = 1248.75

  const recentRecipients = [
    { name: 'Ana\'s Bakery',     initials: 'AB', org: 'Local · Oakland',     last: 'Yesterday' },
    { name: 'Harvest Network',   initials: 'HN', org: 'Sponsee',             last: 'May 31' },
    { name: 'Riverside Co-op',   initials: 'RC', org: 'Local · Berkeley',    last: 'May 28' },
    { name: 'Marcus Chen',       initials: 'MC', org: 'Member',              last: 'May 30' }
  ]

  let query = $state('')
  let selected = $state<{ name: string; initials: string; org: string } | null>(null)
  let amount = $state('')
  let note = $state('')
  let success = $state(false)

  const filtered = $derived(
    query && !selected
      ? recentRecipients.filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
      : []
  )

  function pick(r: { name: string; initials: string; org: string }) {
    selected = r
    query = r.name
  }

  function clearRecipient() {
    selected = null
    query = ''
  }

  const amountValid = $derived(Number(amount) > 0 && Number(amount) <= balance)
  const ready = $derived(!!selected && amountValid)

  function submit() {
    if (!ready) return
    success = true
    setTimeout(() => goto('/preview/dashboard-simple'), 1400)
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
    <h1>Pay</h1>
    <span class="bal-pill">Balance · ${fmt(balance)}</span>
  </header>

  {#if success}
    <div class="success" role="status">
      <div class="check"><Icon name="check" size={32} /></div>
      <h2>Payment sent</h2>
      <p>${fmt(Number(amount))} to {selected?.name}</p>
      <span class="muted">Returning to your dashboard…</span>
    </div>
  {:else}
    <section class="card">
      <h2>Pay whom?</h2>

      <div class="recipient-input">
        {#if selected}
          <div class="picked">
            <span class="avatar">{selected.initials}</span>
            <div>
              <span class="picked-name">{selected.name}</span>
              <span class="picked-org">{selected.org}</span>
            </div>
            <button class="clear" onclick={clearRecipient} aria-label="Clear recipient"><Icon name="x" size={16} /></button>
          </div>
        {:else}
          <div class="search">
            <Icon name="search" size={16} />
            <input
              type="text"
              placeholder="Search by name or scan QR…"
              bind:value={query}
              autocomplete="off"
            />
            <button class="qr" aria-label="Scan QR" title="Scan QR code"><Icon name="eye" size={16} /></button>
          </div>
        {/if}

        {#if filtered.length}
          <ul class="suggest">
            {#each filtered as r}
              <li>
                <button onclick={() => pick(r)}>
                  <span class="avatar small">{r.initials}</span>
                  <div class="suggest-body">
                    <span class="s-name">{r.name}</span>
                    <span class="s-org">{r.org}</span>
                  </div>
                  <span class="s-last">{r.last}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}

        {#if !query && !selected}
          <span class="hint">Recent</span>
          <ul class="recent-grid">
            {#each recentRecipients as r}
              <li>
                <button onclick={() => pick(r)}>
                  <span class="avatar">{r.initials}</span>
                  <span class="r-name">{r.name}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </section>

    <section class="card">
      <h2>How much?</h2>
      <div class="amount-row">
        <span class="currency">$</span>
        <input
          type="text"
          inputmode="decimal"
          placeholder="0.00"
          bind:value={amount}
        />
      </div>
      {#if amount && Number(amount) > balance}
        <p class="warn">Amount exceeds your available balance.</p>
      {/if}
    </section>

    <section class="card">
      <h2>Note <span class="opt">(optional)</span></h2>
      <input
        class="note"
        type="text"
        placeholder="What's this for?"
        bind:value={note}
        maxlength="80"
      />
    </section>

    <button class="pay-btn" disabled={!ready} onclick={submit}>
      {ready ? `Pay $${fmt(Number(amount))}` : 'Pay'}
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
  .opt { color: var(--cg-text-muted); font-weight: 400; }

  /* Recipient */
  .recipient-input { position: relative; }
  .picked { display: grid; grid-template-columns: auto 1fr auto; gap: 0.85rem; align-items: center; padding: 0.65rem 0.85rem; border: 1px solid var(--cg-green); background: rgba(30,122,58,0.05); border-radius: var(--cg-radius-sm); }
  .picked-name { display: block; font-weight: 600; font-size: 0.95rem; }
  .picked-org { display: block; font-size: 0.8rem; color: var(--cg-text-muted); }
  .clear { background: transparent; border: none; cursor: pointer; color: var(--cg-text-muted); padding: 0.25rem; }
  .clear:hover { color: var(--cg-text); }

  .search { display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.85rem; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); color: var(--cg-text-muted); }
  .search:focus-within { border-color: var(--cg-green); box-shadow: 0 0 0 3px var(--cg-green-soft); }
  .search input { flex: 1; border: none; outline: none; background: transparent; font-size: 0.95rem; color: var(--cg-text); }
  .qr { background: transparent; border: none; cursor: pointer; padding: 0.3rem; color: var(--cg-text-muted); border-radius: 6px; }
  .qr:hover { background: var(--cg-bg); color: var(--cg-text); }

  .avatar { width: 2.25rem; height: 2.25rem; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(135deg, #b8d4be 0%, #6fa67e 100%); color: white; font-weight: 600; font-size: 0.78rem; flex-shrink: 0; }
  .avatar.small { width: 1.85rem; height: 1.85rem; font-size: 0.72rem; }

  .suggest { list-style: none; padding: 0; margin: 0.4rem 0 0; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); box-shadow: var(--cg-shadow); position: absolute; top: calc(100% + 0.3rem); left: 0; right: 0; z-index: 10; max-height: 240px; overflow-y: auto; }
  .suggest button { width: 100%; display: grid; grid-template-columns: auto 1fr auto; gap: 0.7rem; align-items: center; padding: 0.55rem 0.85rem; background: transparent; border: none; cursor: pointer; text-align: left; }
  .suggest button:hover { background: var(--cg-bg); }
  .suggest-body { display: grid; gap: 0.1rem; }
  .s-name { font-weight: 500; font-size: 0.9rem; color: var(--cg-text); }
  .s-org { font-size: 0.78rem; color: var(--cg-text-muted); }
  .s-last { font-size: 0.75rem; color: var(--cg-text-muted); }

  .hint { display: block; margin-top: 1rem; font-size: 0.72rem; color: var(--cg-text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
  .recent-grid { list-style: none; padding: 0; margin: 0.5rem 0 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(95px, 1fr)); gap: 0.5rem; }
  .recent-grid button { display: grid; gap: 0.4rem; place-items: center; padding: 0.85rem 0.4rem; background: transparent; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); cursor: pointer; color: var(--cg-text); font-family: inherit; }
  .recent-grid button:hover { border-color: var(--cg-green); }
  .r-name { font-size: 0.78rem; text-align: center; line-height: 1.25; }

  /* Amount */
  .amount-row { display: flex; align-items: baseline; gap: 0.5rem; padding: 0.5rem 0; }
  .currency { font-size: 2rem; color: var(--cg-text-muted); font-weight: 500; }
  .amount-row input { flex: 1; border: none; outline: none; background: transparent; font-size: 2.6rem; font-weight: 600; letter-spacing: -0.02em; color: var(--cg-text); font-variant-numeric: tabular-nums; min-width: 0; }
  .warn { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--cg-error); }

  /* Note */
  .note { width: 100%; padding: 0.6rem 0.85rem; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.95rem; background: var(--cg-surface); color: var(--cg-text); }
  .note:focus { outline: none; border-color: var(--cg-green); box-shadow: 0 0 0 3px var(--cg-green-soft); }

  /* Pay button */
  .pay-btn { width: 100%; padding: 1.1rem; background: var(--cg-green); color: white; border: none; border-radius: var(--cg-radius); font-size: 1.05rem; font-weight: 600; cursor: pointer; transition: background 0.15s; font-variant-numeric: tabular-nums; }
  .pay-btn:hover:not(:disabled) { background: var(--cg-green-hover); }
  .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Success */
  .success { display: grid; place-items: center; gap: 0.5rem; padding: 3rem 1.5rem; text-align: center; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }
  .check { width: 4.5rem; height: 4.5rem; border-radius: 50%; background: rgba(30,122,58,0.1); color: var(--cg-green); display: grid; place-items: center; margin-bottom: 0.75rem; }
  .success h2 { margin: 0; font-size: 1.25rem; font-weight: 600; }
  .success p { margin: 0; color: var(--cg-text); font-size: 1.05rem; font-weight: 500; }
  .muted { color: var(--cg-text-muted); font-size: 0.85rem; margin-top: 0.5rem; }
</style>
