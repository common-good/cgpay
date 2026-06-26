<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  type Status = 'Approved' | 'Pending Review' | 'Under Review' | 'Suspended'

  const orgs: {
    name: string; slug: string; contact: string; mission: string; status: Status;
    grantsYTD: string; lastActivity: string; sponsorshipSince: string
  }[] = [
    { name: 'EarthSeed Consulting',       slug: 'earthseed',       contact: 'Jane Smith',     mission: 'Community-scale environmental consulting and stewardship.',                 status: 'Approved',       grantsYTD: '$153,250', lastActivity: 'May 27, 2026', sponsorshipSince: 'Jan 2024' },
    { name: 'Youth Rise',                  slug: 'youth-rise',      contact: 'Ana Lopez',      mission: 'After-school programs and leadership training for underserved youth.',     status: 'Approved',       grantsYTD: '$98,500',  lastActivity: 'May 25, 2026', sponsorshipSince: 'Mar 2023' },
    { name: 'Harvest Network',             slug: 'harvest',         contact: 'David Okonkwo',  mission: 'Connecting small farms with food banks across the West Coast.',            status: 'Approved',       grantsYTD: '$220,750', lastActivity: 'May 22, 2026', sponsorshipSince: 'Jul 2022' },
    { name: 'Bay Area Foundation',         slug: 'bay-area',        contact: 'Tom Rivera',     mission: 'Community resilience and disaster preparedness in coastal communities.',  status: 'Approved',       grantsYTD: '$67,000',  lastActivity: 'May 21, 2026', sponsorshipSince: 'Sep 2024' },
    { name: 'Pacific Forest Coalition',    slug: 'pacific-forest',  contact: 'Marcus Chen',    mission: 'Old-growth forest restoration and indigenous-led land management.',       status: 'Pending Review', grantsYTD: '—',        lastActivity: 'May 18, 2026', sponsorshipSince: '—' },
    { name: 'Community Neighborhood Services', slug: 'cns',         contact: 'Lily Park',      mission: 'Affordable-housing advocacy and tenant services in urban areas.',         status: 'Under Review',   grantsYTD: '$14,200',  lastActivity: 'May 12, 2026', sponsorshipSince: 'Feb 2025' }
  ]

  let query = $state('')
  let statusFilter = $state<'All' | Status>('All')

  const filtered = $derived(
    orgs.filter(o =>
      (!query || o.name.toLowerCase().includes(query.toLowerCase()) || o.contact.toLowerCase().includes(query.toLowerCase()))
      && (statusFilter === 'All' || o.status === statusFilter)
    )
  )

  // Quick stats row
  const stats = $derived([
    { label: 'Approved',       value: orgs.filter(o => o.status === 'Approved').length,       tone: 'green' },
    { label: 'Pending Review', value: orgs.filter(o => o.status === 'Pending Review').length, tone: 'blue' },
    { label: 'Under Review',   value: orgs.filter(o => o.status === 'Under Review').length,   tone: 'amber' }
  ])

  function pillFor(status: Status): string {
    if (status === 'Approved')       return 'pill-green'
    if (status === 'Pending Review') return 'pill-blue'
    if (status === 'Under Review')   return 'pill-amber'
    return 'pill-red'
  }
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/admin">Admin</a> <span>›</span> <span>Sponsored Organizations</span>
  </nav>

  <header>
    <div>
      <h1>Sponsored Organizations</h1>
      <p>View sponsees, review applications, and track compliance.</p>
    </div>
    <div class="header-actions">
      <button class="ghost"><Icon name="download" size={16} /> Export</button>
      <button class="primary"><Icon name="plus" size={16} /> Add Organization</button>
    </div>
  </header>

  <section class="stats">
    {#each stats as s}
      <div class="card stat">
        <span class="stat-label">{s.label}</span>
        <span class="stat-value tone-text-{s.tone}">{s.value}</span>
      </div>
    {/each}
  </section>

  <div class="main card">
    <div class="toolbar">
      <div class="search">
        <Icon name="search" size={16} />
        <input type="text" placeholder="Search organization or primary contact…" bind:value={query} />
      </div>
      <select bind:value={statusFilter}>
        <option value="All">All statuses</option>
        <option>Approved</option>
        <option>Pending Review</option>
        <option>Under Review</option>
        <option>Suspended</option>
      </select>
    </div>

    <ul class="org-list">
      {#each filtered as o (o.name)}
        <li class="org-row">
          <div class="org-head">
            <div>
              <span class="org-name">{o.name}</span>
              <span class="contact">Primary contact: {o.contact}</span>
            </div>
            <span class="pill {pillFor(o.status)}">{o.status}</span>
          </div>
          <p class="mission">{o.mission}</p>
          <dl class="meta">
            <div><dt>Grants YTD</dt><dd>{o.grantsYTD}</dd></div>
            <div><dt>Last activity</dt><dd>{o.lastActivity}</dd></div>
            <div><dt>Sponsorship since</dt><dd>{o.sponsorshipSince}</dd></div>
          </dl>
          <div class="org-actions">
            <a href="/preview/admin/orgs/{o.slug}"><Icon name="eye" size={14} /> View profile</a>
            <a href="/preview/grants"><Icon name="download" size={14} /> Grants</a>
            <a href="/preview"><Icon name="chat" size={14} /> Message</a>
          </div>
        </li>
      {/each}
      {#if filtered.length === 0}
        <li class="empty">No organizations match the current filters.</li>
      {/if}
    </ul>

    <div class="footer-row">
      <span class="count">Showing {filtered.length} of {orgs.length} organizations</span>
    </div>
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
    background: var(--cg-surface); border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm); font-size: 0.88rem; cursor: pointer; color: var(--cg-text);
  }
  .ghost:hover { border-color: var(--cg-green); }
  .primary {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.55rem 0.95rem;
    background: var(--cg-green); color: white; border: none;
    border-radius: var(--cg-radius-sm); font-size: 0.88rem; font-weight: 500; cursor: pointer;
  }
  .primary:hover { background: var(--cg-green-hover); }

  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }

  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .stat { padding: 1.1rem 1.3rem; display: grid; gap: 0.2rem; }
  .stat-label { font-size: 0.82rem; color: var(--cg-text-muted); font-weight: 500; }
  .stat-value { font-size: 1.6rem; font-weight: 700; letter-spacing: -0.01em; }
  .tone-text-green { color: var(--cg-green); }
  .tone-text-blue  { color: #2d6cbd; }
  .tone-text-amber { color: #b96e0c; }

  .main { padding: 1.25rem; }

  .toolbar { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .search {
    flex: 1; min-width: 240px;
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.5rem 0.75rem; border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm); color: var(--cg-text-muted);
  }
  .search input { border: none; outline: none; background: transparent; flex: 1; font-size: 0.9rem; }
  select {
    padding: 0.5rem 0.75rem; border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm); font-size: 0.88rem; cursor: pointer; background: var(--cg-surface);
  }

  .org-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.85rem; }
  .org-row {
    padding: 1.1rem 1.25rem;
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    transition: border-color 0.15s, background 0.15s;
  }
  .org-row:hover { border-color: var(--cg-green); background: var(--cg-bg); }

  .org-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.5rem; }
  .org-name { display: block; font-weight: 600; font-size: 1.05rem; color: var(--cg-text); }
  .contact { display: block; font-size: 0.85rem; color: var(--cg-text-muted); margin-top: 0.1rem; }
  .mission { margin: 0 0 0.85rem; color: var(--cg-text-muted); font-size: 0.9rem; line-height: 1.45; }

  .meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.5rem;
    margin: 0 0 0.85rem;
    padding: 0.6rem 0.75rem;
    background: var(--cg-bg);
    border-radius: var(--cg-radius-sm);
  }
  .meta div { display: grid; gap: 0.15rem; }
  dt { font-size: 0.72rem; color: var(--cg-text-muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
  dd { margin: 0; font-size: 0.9rem; font-weight: 500; color: var(--cg-text); }

  .org-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .org-actions a {
    display: inline-flex; align-items: center; gap: 0.35rem;
    padding: 0.4rem 0.7rem;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    font-size: 0.82rem;
    color: var(--cg-text);
    text-decoration: none;
  }
  .org-actions a:hover { border-color: var(--cg-green); color: var(--cg-green); }

  .pill { font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap; }
  .pill-green { background: rgba(30,122,58,0.12); color: var(--cg-green); }
  .pill-blue  { background: rgba(45,108,189,0.12); color: #2d6cbd; }
  .pill-amber { background: rgba(214,143,30,0.14); color: #b96e0c; }
  .pill-red   { background: rgba(179,38,30,0.12); color: var(--cg-error); }

  .empty { padding: 2rem; text-align: center; color: var(--cg-text-muted); }
  .footer-row { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
  .count { color: var(--cg-text-muted); font-size: 0.85rem; }
</style>
