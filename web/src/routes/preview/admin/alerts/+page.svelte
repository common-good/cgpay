<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  type Tone = 'red' | 'amber' | 'blue' | 'green'
  type Status = 'Open' | 'Acknowledged' | 'Resolved'

  const alerts: { id: string; tone: Tone; icon: string; title: string; body: string; when: string; status: Status; assigned: string | null }[] = [
    { id: 'a1', tone: 'red',   icon: 'shield', title: 'Deposit amount mismatch',
      body: 'CL+P Distribution — received $26,949.53 vs expected $26,000.00.',
      when: 'May 20, 2026 · 9:57 AM', status: 'Open', assigned: 'Chris A.' },
    { id: 'a2', tone: 'amber', icon: 'clock', title: 'Grant overdue',
      body: 'Enterprise for Youth — $49,500 was expected May 19.',
      when: 'May 19, 2026 · 2:15 PM', status: 'Open', assigned: null },
    { id: 'a3', tone: 'amber', icon: 'user', title: 'Sponsee application awaiting review',
      body: 'Pacific Forest Coalition submitted their application.',
      when: 'May 18, 2026 · 11:02 AM', status: 'Acknowledged', assigned: 'Sarah J.' },
    { id: 'a4', tone: 'red',   icon: 'shield', title: 'Unmatched bank deposit',
      body: 'Waverley Street Foundation $41,666.67 received — no matching expected grant.',
      when: 'May 22, 2026 · 8:11 AM', status: 'Open', assigned: 'Chris A.' },
    { id: 'a5', tone: 'blue',  icon: 'chat', title: 'New member message',
      body: '"I can\'t close my account — the page won\'t let me through."',
      when: 'May 27, 2026 · 4:32 PM', status: 'Open', assigned: null },
    { id: 'a6', tone: 'green', icon: 'check', title: 'Grant matched',
      body: 'Verizon Foundation $25,000 matched to expected grant.',
      when: 'May 21, 2026 · 11:23 AM', status: 'Resolved', assigned: 'Sarah J.' }
  ]

  type Filter = 'All' | Status
  let filter = $state<Filter>('All')

  const filtered = $derived(filter === 'All' ? alerts : alerts.filter(a => a.status === filter))
  const counts = $derived({
    All: alerts.length,
    Open: alerts.filter(a => a.status === 'Open').length,
    Acknowledged: alerts.filter(a => a.status === 'Acknowledged').length,
    Resolved: alerts.filter(a => a.status === 'Resolved').length
  })

  function pillFor(status: Status): string {
    if (status === 'Open') return 'pill-red'
    if (status === 'Acknowledged') return 'pill-amber'
    return 'pill-green'
  }
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/admin">Admin</a> <span>›</span> <span>Alerts</span>
  </nav>

  <header>
    <div>
      <h1>Alerts</h1>
      <p>Issues that need attention — matched deposits, overdue grants, and member requests.</p>
    </div>
    <div class="header-actions">
      <button class="ghost"><Icon name="download" size={16} /> Export</button>
    </div>
  </header>

  <div class="filters">
    {#each ['All','Open','Acknowledged','Resolved'] as f}
      <button class:active={filter === f} onclick={() => (filter = f as Filter)}>
        {f}
        <span class="count">{counts[f as Filter]}</span>
      </button>
    {/each}
  </div>

  <ul class="alert-list">
    {#each filtered as a (a.id)}
      <li class="card">
        <span class="icon tone-{a.tone}"><Icon name={a.icon} size={18} /></span>
        <div class="alert-body">
          <div class="alert-row">
            <span class="title">{a.title}</span>
            <span class="pill {pillFor(a.status)}">{a.status}</span>
          </div>
          <p>{a.body}</p>
          <span class="meta">{a.when} · {a.assigned ? `Assigned to ${a.assigned}` : 'Unassigned'}</span>
        </div>
        <div class="alert-actions">
          {#if a.status === 'Open'}
            <button class="ghost-sm">Acknowledge</button>
            <button class="ghost-sm">Resolve</button>
          {:else if a.status === 'Acknowledged'}
            <button class="ghost-sm">Resolve</button>
          {/if}
          <button class="ghost-sm icon-only" aria-label="More"><Icon name="dots" size={14} /></button>
        </div>
      </li>
    {/each}
    {#if filtered.length === 0}
      <li class="empty">No alerts in this state.</li>
    {/if}
  </ul>
</div>

<style>
  .container { max-width: 1080px; margin: 0 auto; padding: 1.5rem 1.75rem 3rem; }
  .crumbs { font-size: 0.85rem; color: var(--cg-text-muted); margin-bottom: 1rem; }
  .crumbs a { color: var(--cg-green); }
  .crumbs span { margin: 0 0.5rem; }

  header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; gap: 1rem; }
  header h1 { margin: 0 0 0.2rem; font-size: 1.6rem; font-weight: 600; letter-spacing: -0.01em; }
  header p { margin: 0; color: var(--cg-text-muted); font-size: 0.9rem; }
  .ghost { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.9rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.88rem; cursor: pointer; color: var(--cg-text); }
  .ghost:hover { border-color: var(--cg-green); }

  .filters { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .filters button { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.9rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.88rem; cursor: pointer; color: var(--cg-text); font-weight: 500; }
  .filters button:hover { border-color: var(--cg-green); }
  .filters button.active { border-color: var(--cg-green); color: var(--cg-green); background: rgba(30,122,58,0.05); }
  .count { background: var(--cg-bg); color: var(--cg-text-muted); padding: 0.1rem 0.5rem; border-radius: 999px; font-size: 0.76rem; font-weight: 600; }
  .filters button.active .count { background: rgba(30,122,58,0.12); color: var(--cg-green); }

  .alert-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.85rem; }
  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); padding: 1.1rem 1.25rem; display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; align-items: flex-start; }
  .icon { width: 2.4rem; height: 2.4rem; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; }
  .tone-red   { background: rgba(179,38,30,0.1);  color: var(--cg-error); }
  .tone-amber { background: rgba(214,143,30,0.12); color: #b96e0c; }
  .tone-blue  { background: rgba(45,108,189,0.1);  color: #2d6cbd; }
  .tone-green { background: rgba(30,122,58,0.1);   color: var(--cg-green); }

  .alert-body { display: grid; gap: 0.35rem; min-width: 0; }
  .alert-row { display: flex; align-items: center; gap: 0.5rem; }
  .title { font-weight: 600; font-size: 0.95rem; color: var(--cg-text); }
  .alert-body p { margin: 0; color: var(--cg-text-muted); font-size: 0.88rem; line-height: 1.4; }
  .meta { font-size: 0.78rem; color: var(--cg-text-muted); }

  .pill { font-size: 0.7rem; font-weight: 600; padding: 0.18rem 0.5rem; border-radius: 999px; }
  .pill-red   { background: rgba(179,38,30,0.12); color: var(--cg-error); }
  .pill-amber { background: rgba(214,143,30,0.14); color: #b96e0c; }
  .pill-green { background: rgba(30,122,58,0.12); color: var(--cg-green); }

  .alert-actions { display: flex; gap: 0.35rem; align-items: center; flex-shrink: 0; }
  .ghost-sm { padding: 0.35rem 0.7rem; background: transparent; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.8rem; cursor: pointer; color: var(--cg-text); }
  .ghost-sm:hover { border-color: var(--cg-green); color: var(--cg-green); }
  .ghost-sm.icon-only { padding: 0.4rem; }

  .empty { padding: 2.5rem; text-align: center; color: var(--cg-text-muted); border: 1px dashed var(--cg-border); border-radius: var(--cg-radius); }
</style>
