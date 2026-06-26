<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  type Status = 'Matched' | 'Pending' | 'Needs Review' | 'Unmatched' | 'Completed'

  const rows: {
    status: Status; donor: string; org: string; amount: string; payment: string;
    expected: string; received: string; assignedTo: string
  }[] = [
    { status: 'Matched',      donor: 'Verizon Foundation',                  org: 'EarthSeed Consulting', amount: '$25,000.00', payment: 'ACH',   expected: '06/01/2026', received: '05/21/2026', assignedTo: 'Sarah J.' },
    { status: 'Matched',      donor: 'Community Foundation of Sonoma County', org: 'EarthSeed Consulting', amount: '$10,000.00', payment: 'Check', expected: '06/15/2026', received: '05/18/2026', assignedTo: 'Sarah J.' },
    { status: 'Needs Review', donor: 'CL+P Distribution',                   org: 'EarthSeed Consulting', amount: '$26,949.53', payment: 'Check', expected: '05/15/2026', received: '05/18/2026', assignedTo: 'Chris A.' },
    { status: 'Unmatched',    donor: 'Waverley Street Foundation',          org: 'EarthSeed Consulting', amount: '$41,666.67', payment: 'Wire',  expected: '05/10/2026', received: '05/22/2026', assignedTo: 'Chris A.' },
    { status: 'Pending',      donor: 'Enterprise for Youth',                org: 'EarthSeed Consulting', amount: '$49,500.00', payment: 'Check', expected: '06/30/2026', received: '—',          assignedTo: 'Sarah J.' }
  ]

  const tabs: { label: string; count?: number }[] = [
    { label: 'All' },
    { label: 'Pending' },
    { label: 'Matched' },
    { label: 'Needs Review', count: 3 },
    { label: 'Unmatched', count: 2 },
    { label: 'Completed' }
  ]
  let activeTab = $state('All')

  const statusGuide: { label: Status; desc: string; dot: string }[] = [
    { label: 'Matched',      desc: 'Deposit matched to expected grant', dot: 'green' },
    { label: 'Pending',      desc: 'Awaiting deposit',                  dot: 'blue' },
    { label: 'Needs Review', desc: 'Action required',                   dot: 'amber' },
    { label: 'Unmatched',    desc: 'Deposit not matched',               dot: 'red' },
    { label: 'Completed',    desc: 'Deposit processed',                 dot: 'green' }
  ]

  function pillClass(s: Status): string {
    if (s === 'Matched' || s === 'Completed') return 'pill-green'
    if (s === 'Pending') return 'pill-blue'
    if (s === 'Needs Review') return 'pill-amber'
    return 'pill-red'
  }
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/dashboard">Dashboard</a> <span>›</span> <span>Grants</span>
  </nav>

  <header>
    <div>
      <h1>Grants Dashboard</h1>
      <p>View and manage expected grants and received deposits.</p>
    </div>
    <div class="header-actions">
      <button class="ghost"><Icon name="upload" size={16} /> Import Deposits</button>
      <button class="primary"><Icon name="plus" size={16} /> Add Expected Grant</button>
    </div>
  </header>

  <div class="content">
    <div class="main">
      <div class="tabs">
        {#each tabs as t}
          <button class:active={activeTab === t.label} onclick={() => (activeTab = t.label)}>
            {t.label}
            {#if t.count}<span class="tab-badge tab-{t.label.toLowerCase().replace(' ', '-')}">{t.count}</span>{/if}
          </button>
        {/each}
      </div>

      <div class="toolbar">
        <div class="search">
          <Icon name="search" size={16} />
          <input type="text" placeholder="Search donor, organization, amount, check #…" />
        </div>
        <select><option>All Organizations</option></select>
        <select><option>All Types</option></select>
        <button class="ghost"><Icon name="calendar" size={14} /> Custom Range</button>
        <select><option>All Statuses</option></select>
        <button class="ghost"><Icon name="filter" size={14} /> Filters</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Donor / Funder</th>
              <th>Organization</th>
              <th>Amount</th>
              <th>Payment Type</th>
              <th>Expected Date</th>
              <th>Received Date</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each rows as r}
              <tr>
                <td><span class="pill {pillClass(r.status)}">{r.status}</span></td>
                <td>{r.donor}</td>
                <td>{r.org}</td>
                <td>{r.amount}</td>
                <td>{r.payment}</td>
                <td>{r.expected}</td>
                <td>{r.received}</td>
                <td>{r.assignedTo}</td>
                <td class="row-actions">
                  <button aria-label="View"><Icon name="eye" size={16} /></button>
                  <button aria-label="More"><Icon name="dots" size={16} /></button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span>Showing 1 to 5 of 5 results</span>
        <div class="pager">
          <button class="ghost" disabled>‹</button>
          <button class="page-num active">1</button>
          <button class="ghost" disabled>›</button>
        </div>
        <select class="page-size"><option>10 / page</option></select>
      </div>
    </div>

    <aside class="guide card">
      <h3>Status Guide</h3>
      <ul>
        {#each statusGuide as g}
          <li>
            <span class="dot dot-{g.dot}"></span>
            <span class="g-label">{g.label}</span>
            <span class="g-desc">{g.desc}</span>
          </li>
        {/each}
      </ul>
    </aside>
  </div>
</div>

<style>
  .container { max-width: 1280px; margin: 0 auto; padding: 1.5rem 1.75rem 3rem; }
  .crumbs { font-size: 0.85rem; color: var(--cg-text-muted); margin-bottom: 1rem; }
  .crumbs a { color: var(--cg-green); }
  .crumbs span { margin: 0 0.5rem; }

  header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; gap: 1rem; }
  header h1 { margin: 0 0 0.2rem; font-size: 1.6rem; font-weight: 600; letter-spacing: -0.01em; }
  header p { margin: 0; color: var(--cg-text-muted); font-size: 0.9rem; }
  .header-actions { display: flex; gap: 0.6rem; }

  .ghost {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.55rem 0.9rem;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    font-size: 0.88rem;
    cursor: pointer;
    color: var(--cg-text);
  }
  .ghost:hover { border-color: var(--cg-green); }
  .ghost:disabled { opacity: 0.5; cursor: not-allowed; }

  .primary {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.55rem 0.9rem;
    background: var(--cg-green); color: white; border: none;
    border-radius: var(--cg-radius-sm); font-size: 0.88rem; font-weight: 500; cursor: pointer;
  }
  .primary:hover { background: var(--cg-green-hover); }

  .content { display: grid; grid-template-columns: 1fr 280px; gap: 1.5rem; align-items: flex-start; }
  @media (max-width: 1000px) { .content { grid-template-columns: 1fr; } }

  .main { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); padding: 1.25rem; }
  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }

  .tabs { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--cg-border); margin: -0.5rem -1.25rem 1rem; padding: 0 1.25rem; }
  .tabs button {
    padding: 0.85rem 0.6rem; background: transparent; border: none; cursor: pointer;
    color: var(--cg-text-muted); font-size: 0.92rem; font-weight: 500;
    display: inline-flex; align-items: center; gap: 0.4rem;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
  }
  .tabs button.active { color: var(--cg-green); border-bottom-color: var(--cg-green); }
  .tab-badge {
    font-size: 0.7rem; font-weight: 700; padding: 0.05rem 0.45rem; border-radius: 999px;
    background: var(--cg-error); color: white;
  }
  .tab-needs-review { background: #e89826; }

  .toolbar { display: flex; gap: 0.5rem; margin-bottom: 1rem; align-items: center; flex-wrap: wrap; }
  .search {
    flex: 1; min-width: 220px;
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.5rem 0.75rem; background: var(--cg-surface);
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    color: var(--cg-text-muted);
  }
  .search input { border: none; outline: none; background: transparent; flex: 1; font-size: 0.9rem; }
  select {
    padding: 0.5rem 0.75rem; background: var(--cg-surface);
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    font-size: 0.88rem; cursor: pointer;
  }

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
  thead th { text-align: left; padding: 0.65rem 0.85rem; color: var(--cg-text-muted); font-weight: 500; font-size: 0.82rem; border-bottom: 1px solid var(--cg-border); white-space: nowrap; }
  tbody td { padding: 0.85rem; border-bottom: 1px solid var(--cg-border); color: var(--cg-text); }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--cg-bg); }

  .pill { font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap; }
  .pill-green { background: rgba(30,122,58,0.12); color: var(--cg-green); }
  .pill-blue  { background: rgba(45,108,189,0.12); color: #2d6cbd; }
  .pill-amber { background: rgba(214,143,30,0.14); color: #b96e0c; }
  .pill-red   { background: rgba(179,38,30,0.12); color: var(--cg-error); }

  .row-actions { display: flex; gap: 0.25rem; }
  .row-actions button {
    background: transparent; border: none; padding: 0.3rem; cursor: pointer;
    color: var(--cg-text-muted); border-radius: var(--cg-radius-sm);
  }
  .row-actions button:hover { background: var(--cg-bg); color: var(--cg-text); }

  .pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; font-size: 0.85rem; color: var(--cg-text-muted); }
  .pager { display: flex; gap: 0.3rem; }
  .page-num { padding: 0.35rem 0.7rem; border: 1px solid var(--cg-green); background: transparent; color: var(--cg-green); border-radius: var(--cg-radius-sm); cursor: pointer; font-weight: 500; }
  .page-size { padding: 0.35rem 0.6rem; font-size: 0.82rem; }

  .guide { padding: 1.25rem; }
  .guide h3 { margin: 0 0 0.85rem; font-size: 0.95rem; font-weight: 600; }
  .guide ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.6rem; }
  .guide li { display: grid; grid-template-columns: auto auto 1fr; gap: 0.5rem; align-items: center; font-size: 0.85rem; }
  .g-label { font-weight: 600; color: var(--cg-text); }
  .g-desc { color: var(--cg-text-muted); }
  .dot { width: 0.55rem; height: 0.55rem; border-radius: 50%; }
  .dot-green { background: var(--cg-green); }
  .dot-blue  { background: #2d6cbd; }
  .dot-amber { background: #e89826; }
  .dot-red   { background: var(--cg-error); }
</style>
