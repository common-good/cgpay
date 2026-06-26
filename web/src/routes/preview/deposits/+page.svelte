<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  const deposits: { id: string; donor: string; program: string | null; amount: number; expected: string; payment: 'ACH' | 'Check' | 'Wire'; docs: boolean }[] = [
    { id: 'd1', donor: 'Verizon Foundation',                  program: 'Community Food Initiative', amount: 25000.00, expected: 'Jun 01, 2026', payment: 'ACH',   docs: true  },
    { id: 'd2', donor: 'Community Foundation of Sonoma County', program: 'Youth Leadership',         amount: 10000.00, expected: 'Jun 15, 2026', payment: 'Check', docs: true  },
    { id: 'd3', donor: 'CL+P Distribution',                   program: null,                          amount: 26000.00, expected: 'May 15, 2026', payment: 'Check', docs: false },
    { id: 'd4', donor: 'Waverley Street Foundation',          program: 'Conservation initiative',     amount: 41666.67, expected: 'May 10, 2026', payment: 'Wire',  docs: true  },
    { id: 'd5', donor: 'Enterprise for Youth',                program: 'Workforce readiness',         amount: 49500.00, expected: 'Jun 30, 2026', payment: 'Check', docs: false }
  ]

  const total = $derived(deposits.reduce((s, d) => s + d.amount, 0))

  function fmt(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function isOverdue(d: string): boolean {
    return new Date(d) < new Date('2026-06-02')
  }
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/dashboard">Dashboard</a> <span>›</span> <span>Pending Deposits</span>
  </nav>

  <header>
    <div>
      <h1>Pending deposits</h1>
      <p>Expected grants not yet received. Click a row to view or update.</p>
    </div>
    <a class="primary" href="/preview/grants/new"><Icon name="plus" size={16} /> Report Expected Grant</a>
  </header>

  <div class="summary card">
    <div>
      <span class="label">Total expected</span>
      <span class="value">${fmt(total)}</span>
    </div>
    <div>
      <span class="label">Grants</span>
      <span class="value">{deposits.length}</span>
    </div>
    <div>
      <span class="label">Overdue</span>
      <span class="value warn">{deposits.filter(d => isOverdue(d.expected)).length}</span>
    </div>
  </div>

  <ul class="dep-list">
    {#each deposits as d (d.id)}
      <li class="card" class:overdue={isOverdue(d.expected)}>
        <div class="head">
          <div>
            <span class="donor">{d.donor}</span>
            {#if d.program}<span class="program">{d.program}</span>{/if}
          </div>
          <span class="amount">${fmt(d.amount)}</span>
        </div>
        <dl class="meta">
          <div><dt>Expected</dt><dd class:warn={isOverdue(d.expected)}>{d.expected}{#if isOverdue(d.expected)} · overdue{/if}</dd></div>
          <div><dt>Payment</dt><dd>{d.payment}</dd></div>
          <div><dt>Document</dt><dd>{d.docs ? 'Uploaded' : 'Missing'}</dd></div>
        </dl>
        <div class="actions">
          <button class="ghost-sm"><Icon name="eye" size={14} /> View</button>
          <button class="ghost-sm">Edit</button>
          {#if !d.docs}<button class="ghost-sm primary-tone"><Icon name="upload" size={14} /> Add document</button>{/if}
        </div>
      </li>
    {/each}
    {#if deposits.length === 0}
      <li class="empty">No pending deposits. Report an expected grant to get started.</li>
    {/if}
  </ul>
</div>

<style>
  .container { max-width: 920px; margin: 0 auto; padding: 1.5rem 1.75rem 3rem; }
  .crumbs { font-size: 0.85rem; color: var(--cg-text-muted); margin-bottom: 1rem; }
  .crumbs a { color: var(--cg-green); }
  .crumbs span { margin: 0 0.5rem; }

  header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.25rem; gap: 1rem; }
  header h1 { margin: 0 0 0.2rem; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.01em; }
  header p { margin: 0; color: var(--cg-text-muted); font-size: 0.9rem; }
  .primary { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.95rem; background: var(--cg-green); color: white; border: none; border-radius: var(--cg-radius-sm); font-size: 0.88rem; font-weight: 500; cursor: pointer; text-decoration: none; }
  .primary:hover { background: var(--cg-green-hover); text-decoration: none; }

  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }

  .summary { padding: 1rem 1.25rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
  .summary > div { display: grid; gap: 0.2rem; }
  .label { font-size: 0.78rem; color: var(--cg-text-muted); font-weight: 500; }
  .value { font-size: 1.3rem; font-weight: 700; color: var(--cg-text); letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
  .value.warn { color: var(--cg-error); }

  .dep-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.85rem; }
  .dep-list .card { padding: 1.1rem 1.25rem; display: grid; gap: 0.85rem; transition: border-color 0.15s; }
  .dep-list .card:hover { border-color: var(--cg-green); }
  .dep-list .card.overdue { border-left: 3px solid var(--cg-error); }

  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
  .donor { display: block; font-weight: 600; font-size: 1rem; color: var(--cg-text); }
  .program { display: block; font-size: 0.85rem; color: var(--cg-text-muted); margin-top: 0.15rem; }
  .amount { font-size: 1.2rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--cg-text); white-space: nowrap; }

  .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem 1rem; margin: 0; padding: 0.65rem 0.85rem; background: var(--cg-bg); border-radius: var(--cg-radius-sm); }
  .meta > div { display: grid; gap: 0.15rem; }
  dt { font-size: 0.7rem; color: var(--cg-text-muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
  dd { margin: 0; font-size: 0.88rem; font-weight: 500; color: var(--cg-text); }
  dd.warn { color: var(--cg-error); }

  .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .ghost-sm { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.75rem; background: transparent; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.82rem; cursor: pointer; color: var(--cg-text); }
  .ghost-sm:hover { border-color: var(--cg-green); color: var(--cg-green); }
  .ghost-sm.primary-tone { border-color: var(--cg-green); color: var(--cg-green); background: rgba(30,122,58,0.05); }

  .empty { padding: 2.5rem; text-align: center; color: var(--cg-text-muted); border: 1px dashed var(--cg-border); border-radius: var(--cg-radius); }
</style>
