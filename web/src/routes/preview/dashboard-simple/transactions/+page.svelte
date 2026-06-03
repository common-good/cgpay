<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  type TxKind = 'paid' | 'received' | 'transfer-in' | 'transfer-out'
  type Tx = { kind: TxKind; counterparty: string; note: string; amount: number; when: string }

  const all: Tx[] = [
    { kind: 'received',    counterparty: 'Riverside Co-op',         note: 'Refund — community shares', amount:  45.00, when: 'Today · 9:14 AM'    },
    { kind: 'paid',        counterparty: 'Ana\'s Bakery',           note: 'Saturday breakfast',        amount: -18.75, when: 'Today · 8:02 AM'    },
    { kind: 'transfer-out',counterparty: 'Bank ····4912',           note: 'Transfer to bank',           amount:-200.00, when: 'Yesterday · 4:30 PM' },
    { kind: 'paid',        counterparty: 'Harvest Network',         note: 'Monthly contribution',      amount: -50.00, when: 'May 31 · 11:00 AM'  },
    { kind: 'received',    counterparty: 'Marcus Chen',             note: 'Split utilities · April',   amount:  87.50, when: 'May 30 · 2:14 PM'   },
    { kind: 'transfer-in', counterparty: 'Bank ····4912',           note: 'Transfer from bank',         amount: 250.00, when: 'May 29 · 8:00 AM'   },
    { kind: 'paid',        counterparty: 'Sarah Johnson',           note: 'Lunch · split',              amount: -14.50, when: 'May 28 · 12:48 PM'  },
    { kind: 'received',    counterparty: 'Bay Area Foundation',     note: 'Honorarium · talk',          amount: 350.00, when: 'May 27 · 10:00 AM'  },
    { kind: 'paid',        counterparty: 'Youth Rise',              note: 'Quarterly contribution',     amount:-100.00, when: 'May 25 · 9:30 AM'   },
    { kind: 'received',    counterparty: 'Ana Lopez',               note: 'Shared groceries',           amount:  32.40, when: 'May 23 · 7:14 PM'   },
    { kind: 'transfer-in', counterparty: 'Bank ····4912',           note: 'Transfer from bank',         amount: 500.00, when: 'May 20 · 8:00 AM'   },
    { kind: 'paid',        counterparty: 'Riverside Co-op',         note: 'Weekly share',               amount: -42.00, when: 'May 18 · 11:22 AM'  }
  ]

  type Kind = 'All' | 'Sent' | 'Received' | 'Transfers'
  let kind = $state<Kind>('All')
  let query = $state('')

  const filtered = $derived(
    all.filter(t => {
      const matchesKind =
        kind === 'All' ||
        (kind === 'Sent' && t.kind === 'paid') ||
        (kind === 'Received' && t.kind === 'received') ||
        (kind === 'Transfers' && (t.kind === 'transfer-in' || t.kind === 'transfer-out'))
      const matchesQuery = !query ||
        t.counterparty.toLowerCase().includes(query.toLowerCase()) ||
        t.note.toLowerCase().includes(query.toLowerCase())
      return matchesKind && matchesQuery
    })
  )

  function fmt(n: number): string {
    const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return (n < 0 ? '−' : '+') + '$' + abs
  }
  function icon(k: TxKind): string {
    if (k === 'paid') return 'arrow'
    if (k === 'received' || k === 'transfer-in') return 'download'
    return 'upload'
  }
  function tone(k: TxKind): string {
    return (k === 'received' || k === 'transfer-in') ? 'tx-in' : 'tx-out'
  }
</script>

<div class="page">
  <header class="topbar">
    <a class="back" href="/preview/dashboard-simple" aria-label="Back">
      <Icon name="arrow" size={18} class="back-arrow" />
    </a>
    <h1>All transactions</h1>
    <button class="ghost-sm" aria-label="Export"><Icon name="download" size={14} /></button>
  </header>

  <div class="filters">
    <div class="search">
      <Icon name="search" size={16} />
      <input type="text" placeholder="Search counterparty or note…" bind:value={query} />
    </div>
    <div class="kind-tabs">
      {#each ['All','Sent','Received','Transfers'] as k}
        <button class:active={kind === k} onclick={() => (kind = k as Kind)}>{k}</button>
      {/each}
    </div>
  </div>

  <ul class="tx-list">
    {#each filtered as t}
      <li>
        <span class="tx-icon {tone(t.kind)}"><Icon name={icon(t.kind)} size={16} /></span>
        <div class="tx-body">
          <span class="tx-counter">{t.counterparty}</span>
          <span class="tx-note">{t.note}</span>
        </div>
        <div class="tx-amt {tone(t.kind)}">
          <span class="tx-value">{fmt(t.amount)}</span>
          <span class="tx-when">{t.when}</span>
        </div>
      </li>
    {/each}
    {#if filtered.length === 0}
      <li class="empty">No transactions match your search.</li>
    {/if}
  </ul>
</div>

<style>
  .page { max-width: 720px; margin: 0 auto; padding: 1rem 1.25rem 2.5rem; display: grid; gap: 1rem; }

  .topbar { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.85rem; padding: 0.25rem 0 0.5rem; }
  .back { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: 50%; background: var(--cg-surface); border: 1px solid var(--cg-border); text-decoration: none; }
  .back:hover { border-color: var(--cg-green); }
  :global(.back-arrow) { transform: rotate(180deg); color: var(--cg-text); }
  .topbar h1 { margin: 0; font-size: 1.15rem; font-weight: 600; }
  .ghost-sm { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: 50%; cursor: pointer; color: var(--cg-text-muted); }
  .ghost-sm:hover { border-color: var(--cg-green); color: var(--cg-green); }

  .filters { display: grid; gap: 0.6rem; }
  .search { display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.85rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); color: var(--cg-text-muted); }
  .search input { flex: 1; border: none; outline: none; background: transparent; font-size: 0.95rem; color: var(--cg-text); }
  .kind-tabs { display: grid; grid-template-columns: repeat(4, 1fr); background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); padding: 0.3rem; gap: 0.25rem; }
  .kind-tabs button { padding: 0.5rem; background: transparent; border: none; border-radius: var(--cg-radius-sm); cursor: pointer; font-family: inherit; font-size: 0.85rem; font-weight: 500; color: var(--cg-text-muted); }
  .kind-tabs button.active { background: rgba(30,122,58,0.1); color: var(--cg-green); }

  .tx-list { list-style: none; padding: 0.25rem 1.2rem; margin: 0; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }
  .tx-list li:not(.empty) { display: grid; grid-template-columns: auto 1fr auto; gap: 0.85rem; align-items: center; padding: 0.85rem 0; border-bottom: 1px solid var(--cg-border); }
  .tx-list li:last-child { border-bottom: none; }

  .tx-icon { width: 2.15rem; height: 2.15rem; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; }
  .tx-in  { color: var(--cg-green); }
  .tx-out { color: var(--cg-text); }
  .tx-icon.tx-in  { background: rgba(30,122,58,0.1); }
  .tx-icon.tx-out { background: var(--cg-bg); }

  .tx-body { display: grid; gap: 0.1rem; min-width: 0; }
  .tx-counter { font-weight: 500; font-size: 0.95rem; color: var(--cg-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tx-note { font-size: 0.82rem; color: var(--cg-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .tx-amt { text-align: right; display: grid; gap: 0.1rem; }
  .tx-value { font-weight: 600; font-size: 0.95rem; font-variant-numeric: tabular-nums; }
  .tx-amt.tx-in  .tx-value { color: var(--cg-green); }
  .tx-amt.tx-out .tx-value { color: var(--cg-text); }
  .tx-when { font-size: 0.78rem; color: var(--cg-text-muted); }

  .empty { padding: 2.5rem 1rem; text-align: center; color: var(--cg-text-muted); }
</style>
