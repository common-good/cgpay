<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'
  import Tooltip from '$lib/components/Tooltip.svelte'

  // William's spec for the ordinary-user dashboard:
  //  - Top four functions only (Pay / Receive-Request-Charge / Transfer-Bank / recent txs)
  //  - Everything else moves to secondary menus
  //  - Clean and simple

  const balance = 1248.75

  type TxKind = 'paid' | 'received' | 'transfer-in' | 'transfer-out'
  type Tx = {
    kind: TxKind
    counterparty: string
    note: string
    amount: number
    when: string
  }
  const recent: Tx[] = [
    { kind: 'received',    counterparty: 'Riverside Co-op',          note: 'Refund — community shares',         amount:  45.00, when: 'Today · 9:14 AM'   },
    { kind: 'paid',        counterparty: 'Ana\'s Bakery',            note: 'Saturday breakfast',                amount: -18.75, when: 'Today · 8:02 AM'   },
    { kind: 'transfer-out',counterparty: 'Bank ····4912',            note: 'Transfer to bank',                   amount:-200.00, when: 'Yesterday · 4:30 PM' },
    { kind: 'paid',        counterparty: 'Harvest Network',          note: 'Monthly contribution',              amount: -50.00, when: 'May 31 · 11:00 AM' },
    { kind: 'received',    counterparty: 'Marcus Chen',              note: 'Split utilities · April',           amount:  87.50, when: 'May 30 · 2:14 PM'  },
    { kind: 'transfer-in', counterparty: 'Bank ····4912',            note: 'Transfer from bank',                amount: 250.00, when: 'May 29 · 8:00 AM'  }
  ]

  function fmt(n: number): string {
    const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return (n < 0 ? '−' : '+') + '$' + abs
  }

  function icon(k: TxKind): string {
    if (k === 'paid') return 'arrow'
    if (k === 'received') return 'download'
    if (k === 'transfer-in') return 'download'
    return 'upload'
  }

  function toneClass(k: TxKind): string {
    if (k === 'received' || k === 'transfer-in') return 'tx-in'
    return 'tx-out'
  }
</script>

<div class="page">
  <header class="hero">
    <span class="greeting">Hi, Alex</span>
    <div class="balance-row">
      <span class="label">Balance</span>
      <span class="amount">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
  </header>

  <section class="actions">
    <Tooltip text="Send funds to another member or business" position="bottom">
      <button class="action pay">
        <span class="action-icon"><Icon name="arrow" size={22} /></span>
        <span class="action-label">Pay</span>
      </button>
    </Tooltip>

    <Tooltip text="Request payment or charge a customer's QR" position="bottom">
      <button class="action receive">
        <span class="action-icon"><Icon name="download" size={22} /></span>
        <span class="action-label">Receive</span>
      </button>
    </Tooltip>

    <Tooltip text="Move funds between your bank and Common Good" position="bottom">
      <button class="action transfer">
        <span class="action-icon"><Icon name="bank" size={22} /></span>
        <span class="action-label">Transfer</span>
      </button>
    </Tooltip>
  </section>

  <section class="recent">
    <div class="recent-head">
      <h2>Recent transactions</h2>
      <a class="view-all" href="/preview/dashboard-simple">View all →</a>
    </div>

    <ul class="tx-list">
      {#each recent as t}
        <li>
          <span class="tx-icon {toneClass(t.kind)}"><Icon name={icon(t.kind)} size={16} /></span>
          <div class="tx-body">
            <span class="tx-counter">{t.counterparty}</span>
            <span class="tx-note">{t.note}</span>
          </div>
          <div class="tx-amt {toneClass(t.kind)}">
            <span class="tx-value">{fmt(t.amount)}</span>
            <span class="tx-when">{t.when}</span>
          </div>
        </li>
      {/each}
    </ul>
  </section>

  <footer class="more">
    <a href="/preview">More → Documents, Profile, Messages, Settings</a>
  </footer>
</div>

<style>
  .page {
    max-width: 720px;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 3rem;
  }

  /* Hero — large balance is the focal point */
  .hero {
    background:
      linear-gradient(135deg, rgba(30,122,58,0.05) 0%, rgba(30,122,58,0.02) 100%);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    padding: 1.5rem 1.75rem;
    margin-bottom: 1.5rem;
  }
  .greeting {
    display: block;
    font-size: 0.92rem;
    color: var(--cg-text-muted);
    margin-bottom: 0.5rem;
  }
  .balance-row { display: grid; gap: 0.2rem; }
  .label {
    font-size: 0.7rem;
    color: var(--cg-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }
  .amount {
    font-size: 2.5rem;
    font-weight: 600;
    letter-spacing: -0.025em;
    color: var(--cg-text);
    font-variant-numeric: tabular-nums;
  }

  /* Three big action buttons */
  .actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 480px) {
    .actions { gap: 0.5rem; }
  }
  .action {
    display: grid;
    place-items: center;
    gap: 0.5rem;
    padding: 1.4rem 0.75rem;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    cursor: pointer;
    transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
    font-family: inherit;
    color: var(--cg-text);
    width: 100%;
  }
  .action:hover {
    border-color: var(--cg-green);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06);
  }
  .action-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: rgba(30,122,58,0.1);
    color: var(--cg-green);
  }
  .action.receive .action-icon { background: rgba(45,108,189,0.1); color: #2d6cbd; }
  .action.transfer .action-icon { background: rgba(214,143,30,0.12); color: #b96e0c; }
  .action-label {
    font-weight: 600;
    font-size: 0.98rem;
  }

  /* Recent transactions */
  .recent {
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    padding: 1.25rem 1.25rem 0.85rem;
  }
  .recent-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.85rem;
  }
  .recent-head h2 { margin: 0; font-size: 1rem; font-weight: 600; }
  .view-all { font-size: 0.85rem; color: var(--cg-green); }

  .tx-list { list-style: none; padding: 0; margin: 0; }
  .tx-list li {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.85rem;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--cg-border);
  }
  .tx-list li:last-child { border-bottom: none; }

  .tx-icon {
    width: 2.15rem;
    height: 2.15rem;
    border-radius: 50%;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .tx-in  { color: var(--cg-green); }
  .tx-out { color: var(--cg-text); }
  .tx-icon.tx-in  { background: rgba(30,122,58,0.1); }
  .tx-icon.tx-out { background: var(--cg-bg); }

  .tx-body { display: grid; gap: 0.1rem; min-width: 0; }
  .tx-counter {
    font-weight: 500;
    font-size: 0.95rem;
    color: var(--cg-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tx-note {
    font-size: 0.82rem;
    color: var(--cg-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tx-amt { text-align: right; display: grid; gap: 0.1rem; }
  .tx-value {
    font-weight: 600;
    font-size: 0.95rem;
    font-variant-numeric: tabular-nums;
  }
  .tx-amt.tx-in  .tx-value { color: var(--cg-green); }
  .tx-amt.tx-out .tx-value { color: var(--cg-text); }
  .tx-when {
    font-size: 0.78rem;
    color: var(--cg-text-muted);
  }

  /* Secondary access — quiet link to everything else */
  .more {
    margin-top: 1.5rem;
    text-align: center;
  }
  .more a {
    font-size: 0.85rem;
    color: var(--cg-text-muted);
  }
  .more a:hover { color: var(--cg-green); }
</style>
