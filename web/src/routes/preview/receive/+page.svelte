<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  const myCode = 'CG·K6VMDCA'
  const myName = 'Alex Rivera'

  type Mode = 'qr' | 'request'
  let mode = $state<Mode>('qr')

  // Request-payment form
  let from = $state('')
  let amount = $state('')
  let note = $state('')
  let sent = $state(false)

  const knownPeople = [
    'Ana\'s Bakery',
    'Harvest Network',
    'Marcus Chen',
    'Riverside Co-op',
    'Sarah Johnson'
  ]
  const filtered = $derived(
    from ? knownPeople.filter(p => p.toLowerCase().includes(from.toLowerCase())) : []
  )

  const ready = $derived(from.trim().length > 0 && Number(amount) > 0)

  function submitRequest() {
    if (!ready) return
    sent = true
    setTimeout(() => { sent = false; from = ''; amount = ''; note = '' }, 1800)
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
    <h1>Receive</h1>
    <div style="width: 2.25rem"></div>
  </header>

  <div class="mode-tabs">
    <button class:active={mode === 'qr'} onclick={() => (mode = 'qr')}>
      <Icon name="eye" size={16} /> Show my QR
    </button>
    <button class:active={mode === 'request'} onclick={() => (mode = 'request')}>
      <Icon name="download" size={16} /> Request payment
    </button>
  </div>

  {#if mode === 'qr'}
    <section class="qr-card">
      <span class="my-name">{myName}</span>
      <div class="qr-frame">
        <!-- Placeholder QR — visually convincing without being a real scannable code -->
        <svg viewBox="0 0 100 100" class="qr-svg" aria-hidden="true">
          {#each Array(196) as _, i}
            {@const cellSize = 4}
            {@const cols = 25}
            {@const r = Math.floor(i / cols)}
            {@const c = i % cols}
            {@const hash = (r * 31 + c * 17 + r * c) % 7}
            {@const isCorner = (r < 7 && c < 7) || (r < 7 && c > cols - 8) || (r > cols - 8 && c < 7)}
            {#if isCorner ? ((r === 0 || r === 6 || c === 0 || c === 6 || (r > 1 && r < 5 && c > 1 && c < 5)) && !(r === 0 && c === cols - 8) && !(r === 6 && c === cols - 8)) : hash < 3}
              <rect x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#1a1f1c" />
            {/if}
          {/each}
        </svg>
      </div>
      <span class="my-code">{myCode}</span>
      <p class="hint">Have the other person open <strong>Pay</strong> in their app and scan this code.</p>
    </section>
  {:else}
    {#if sent}
      <div class="sent">
        <div class="check"><Icon name="check" size={28} /></div>
        <h2>Request sent</h2>
        <p>${fmt(Number(amount))} requested from {from}.</p>
        <span class="muted">They'll be notified now.</span>
      </div>
    {:else}
      <section class="card">
        <h2>From whom?</h2>
        <div class="search">
          <Icon name="search" size={16} />
          <input type="text" placeholder="Search by name…" bind:value={from} autocomplete="off" />
        </div>
        {#if filtered.length && from && !knownPeople.includes(from)}
          <ul class="suggest">
            {#each filtered as p}
              <li><button onclick={() => (from = p)}>{p}</button></li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="card">
        <h2>How much?</h2>
        <div class="amount-row">
          <span class="currency">$</span>
          <input type="text" inputmode="decimal" placeholder="0.00" bind:value={amount} />
        </div>
      </section>

      <section class="card">
        <h2>Note <span class="opt">(optional)</span></h2>
        <input class="note" type="text" placeholder="What's this for?" bind:value={note} maxlength="80" />
      </section>

      <button class="req-btn" disabled={!ready} onclick={submitRequest}>
        {ready ? `Request $${fmt(Number(amount))}` : 'Request payment'}
      </button>
    {/if}
  {/if}
</div>

<style>
  .page { max-width: 540px; margin: 0 auto; padding: 1rem 1.25rem 2.5rem; display: grid; gap: 1rem; }

  .topbar { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.85rem; padding: 0.25rem 0 0.5rem; }
  .back { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: 50%; background: var(--cg-surface); border: 1px solid var(--cg-border); text-decoration: none; }
  .back:hover { border-color: var(--cg-green); }
  :global(.back-arrow) { transform: rotate(180deg); color: var(--cg-text); }
  .topbar h1 { margin: 0; font-size: 1.15rem; font-weight: 600; }

  .mode-tabs { display: grid; grid-template-columns: 1fr 1fr; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); padding: 0.3rem; gap: 0.25rem; }
  .mode-tabs button { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.6rem 0.5rem; background: transparent; border: none; border-radius: var(--cg-radius-sm); cursor: pointer; font-family: inherit; font-size: 0.88rem; font-weight: 500; color: var(--cg-text-muted); }
  .mode-tabs button.active { background: rgba(30,122,58,0.1); color: var(--cg-green); }

  /* QR card */
  .qr-card { display: grid; gap: 0.85rem; place-items: center; padding: 2rem 1.5rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); text-align: center; }
  .my-name { font-size: 1.05rem; font-weight: 600; color: var(--cg-text); }
  .qr-frame { width: 240px; height: 240px; padding: 1rem; background: white; border-radius: var(--cg-radius); box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .qr-svg { width: 100%; height: 100%; display: block; }
  .my-code { font-family: 'SF Mono', Menlo, monospace; font-size: 0.95rem; color: var(--cg-text); letter-spacing: 0.04em; background: var(--cg-bg); padding: 0.4rem 0.8rem; border-radius: var(--cg-radius-sm); }
  .qr-card .hint { margin: 0.4rem 0 0; font-size: 0.85rem; color: var(--cg-text-muted); max-width: 320px; line-height: 1.4; }
  .qr-card strong { color: var(--cg-text); font-weight: 600; }

  /* Request-payment form (mirrors Pay layout) */
  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); padding: 1.1rem 1.2rem; position: relative; }
  .card h2 { margin: 0 0 0.85rem; font-size: 0.9rem; font-weight: 600; color: var(--cg-text); }
  .opt { color: var(--cg-text-muted); font-weight: 400; }

  .search { display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.85rem; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); color: var(--cg-text-muted); }
  .search:focus-within { border-color: var(--cg-green); box-shadow: 0 0 0 3px var(--cg-green-soft); }
  .search input { flex: 1; border: none; outline: none; background: transparent; font-size: 0.95rem; color: var(--cg-text); }

  .suggest { list-style: none; padding: 0; margin: 0.4rem 0 0; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); box-shadow: var(--cg-shadow); position: absolute; top: calc(100% - 0.6rem); left: 1.2rem; right: 1.2rem; z-index: 10; }
  .suggest button { width: 100%; text-align: left; padding: 0.55rem 0.85rem; background: transparent; border: none; cursor: pointer; font-size: 0.9rem; }
  .suggest button:hover { background: var(--cg-bg); }

  .amount-row { display: flex; align-items: baseline; gap: 0.5rem; padding: 0.5rem 0; }
  .currency { font-size: 2rem; color: var(--cg-text-muted); font-weight: 500; }
  .amount-row input { flex: 1; border: none; outline: none; background: transparent; font-size: 2.6rem; font-weight: 600; letter-spacing: -0.02em; color: var(--cg-text); font-variant-numeric: tabular-nums; min-width: 0; }

  .note { width: 100%; padding: 0.6rem 0.85rem; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.95rem; background: var(--cg-surface); color: var(--cg-text); }
  .note:focus { outline: none; border-color: var(--cg-green); box-shadow: 0 0 0 3px var(--cg-green-soft); }

  .req-btn { width: 100%; padding: 1.1rem; background: #2d6cbd; color: white; border: none; border-radius: var(--cg-radius); font-size: 1.05rem; font-weight: 600; cursor: pointer; transition: background 0.15s; font-variant-numeric: tabular-nums; }
  .req-btn:hover:not(:disabled) { background: #225097; }
  .req-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .sent { display: grid; place-items: center; gap: 0.4rem; padding: 2.5rem 1.5rem; text-align: center; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }
  .check { width: 4rem; height: 4rem; border-radius: 50%; background: rgba(45,108,189,0.1); color: #2d6cbd; display: grid; place-items: center; margin-bottom: 0.5rem; }
  .sent h2 { margin: 0; font-size: 1.2rem; font-weight: 600; }
  .sent p { margin: 0; font-size: 1rem; font-weight: 500; }
  .muted { color: var(--cg-text-muted); font-size: 0.85rem; margin-top: 0.4rem; }
</style>
