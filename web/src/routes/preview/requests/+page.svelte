<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  type Direction = 'incoming' | 'outgoing'
  type Status = 'Awaiting approval' | 'Approved · awaiting transfer'

  const requests: { id: string; direction: Direction; counterparty: string; amount: number; note: string; created: string; status: Status }[] = [
    { id: 'r1', direction: 'incoming', counterparty: 'Common Good (transfer-out)', amount: 10000.00, note: 'Transfer to Wells Fargo ····4912', created: 'May 18, 2026', status: 'Approved · awaiting transfer' },
    { id: 'r2', direction: 'outgoing', counterparty: 'Pacific Forest Coalition',  amount:   500.00, note: 'Joint program planning · April',     created: 'May 24, 2026', status: 'Awaiting approval' }
  ]

  function fmt(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/dashboard">Dashboard</a> <span>›</span> <span>Pending Requests</span>
  </nav>

  <header>
    <div>
      <h1>Pending requests</h1>
      <p>Requests waiting on either approval or transfer.</p>
    </div>
    <button class="primary"><Icon name="plus" size={16} /> Request Transfer</button>
  </header>

  <ul class="req-list">
    {#each requests as r}
      <li class="card">
        <div class="head">
          <div class="who">
            <span class="dir-icon">
              <Icon name={r.direction === 'incoming' ? 'download' : 'upload'} size={18} />
            </span>
            <div>
              <span class="cp">{r.counterparty}</span>
              <span class="note">{r.note}</span>
            </div>
          </div>
          <span class="amount">${fmt(r.amount)}</span>
        </div>
        <div class="meta">
          <span class="pill {r.status === 'Awaiting approval' ? 'pill-amber' : 'pill-blue'}">{r.status}</span>
          <span class="created">Created {r.created}</span>
        </div>
        <div class="actions">
          {#if r.status === 'Awaiting approval'}
            <button class="ghost-sm">Approve</button>
            <button class="ghost-sm danger">Reject</button>
          {/if}
          <button class="ghost-sm">View details</button>
        </div>
      </li>
    {/each}
    {#if requests.length === 0}
      <li class="empty">No pending requests.</li>
    {/if}
  </ul>
</div>

<style>
  .container { max-width: 800px; margin: 0 auto; padding: 1.5rem 1.75rem 3rem; }
  .crumbs { font-size: 0.85rem; color: var(--cg-text-muted); margin-bottom: 1rem; }
  .crumbs a { color: var(--cg-green); }
  .crumbs span { margin: 0 0.5rem; }

  header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.25rem; gap: 1rem; }
  header h1 { margin: 0 0 0.2rem; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.01em; }
  header p { margin: 0; color: var(--cg-text-muted); font-size: 0.9rem; }
  .primary { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.95rem; background: var(--cg-green); color: white; border: none; border-radius: var(--cg-radius-sm); font-size: 0.88rem; font-weight: 500; cursor: pointer; }
  .primary:hover { background: var(--cg-green-hover); }

  .req-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.85rem; }
  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); padding: 1.1rem 1.25rem; display: grid; gap: 0.85rem; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
  .who { display: flex; gap: 0.85rem; align-items: center; }
  .dir-icon { width: 2.4rem; height: 2.4rem; border-radius: 50%; background: rgba(45,108,189,0.1); color: #2d6cbd; display: grid; place-items: center; flex-shrink: 0; }
  .cp { display: block; font-weight: 600; font-size: 1rem; color: var(--cg-text); }
  .note { display: block; font-size: 0.85rem; color: var(--cg-text-muted); margin-top: 0.15rem; }
  .amount { font-size: 1.2rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--cg-text); }

  .meta { display: flex; gap: 0.85rem; align-items: center; font-size: 0.82rem; color: var(--cg-text-muted); }
  .pill { font-size: 0.7rem; font-weight: 600; padding: 0.18rem 0.55rem; border-radius: 999px; }
  .pill-amber { background: rgba(214,143,30,0.14); color: #b96e0c; }
  .pill-blue  { background: rgba(45,108,189,0.12); color: #2d6cbd; }
  .created { font-size: 0.82rem; }

  .actions { display: flex; gap: 0.5rem; }
  .ghost-sm { padding: 0.4rem 0.85rem; background: transparent; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.85rem; cursor: pointer; color: var(--cg-text); }
  .ghost-sm:hover { border-color: var(--cg-green); color: var(--cg-green); }
  .ghost-sm.danger { color: var(--cg-error); }
  .ghost-sm.danger:hover { border-color: var(--cg-error); color: var(--cg-error); }

  .empty { padding: 2.5rem; text-align: center; color: var(--cg-text-muted); border: 1px dashed var(--cg-border); border-radius: var(--cg-radius); }
</style>
