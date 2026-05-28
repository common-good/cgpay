<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  type Role = 'Super Admin' | 'Finance' | 'Sponsee Lead' | 'Board' | 'Member'
  type Status = 'Active' | 'Pending' | 'Suspended'

  const rows: { name: string; email: string; role: Role; org: string; status: Status; lastLogin: string }[] = [
    { name: 'Jane Smith',     email: 'jane@earthseed.org',     role: 'Sponsee Lead', org: 'EarthSeed Consulting',          status: 'Active',  lastLogin: 'May 27, 2026' },
    { name: 'Marcus Chen',    email: 'marcus@pacificforest.org', role: 'Sponsee Lead', org: 'Pacific Forest Coalition',     status: 'Pending', lastLogin: '—' },
    { name: 'Sarah Johnson',  email: 'sarah@commongood.earth', role: 'Finance',      org: 'Common Good',                   status: 'Active',  lastLogin: 'May 27, 2026' },
    { name: 'Chris Avila',    email: 'chris.a@commongood.earth', role: 'Super Admin', org: 'Common Good',                 status: 'Active',  lastLogin: 'May 26, 2026' },
    { name: 'Ana Lopez',      email: 'ana@youthrise.org',      role: 'Member',       org: 'Youth Rise',                    status: 'Active',  lastLogin: 'May 25, 2026' },
    { name: 'David Okonkwo',  email: 'david@harvestnetwork.org', role: 'Board',      org: 'Harvest Network',               status: 'Active',  lastLogin: 'May 22, 2026' },
    { name: 'Lily Park',      email: 'lily@cnservices.org',    role: 'Member',       org: 'Community Neighborhood Services', status: 'Suspended', lastLogin: 'Apr 10, 2026' },
    { name: 'Tom Rivera',     email: 'tom@bayareafoundation.org', role: 'Member',    org: 'Bay Area Foundation',           status: 'Active',  lastLogin: 'May 21, 2026' }
  ]

  let query = $state('')
  let roleFilter = $state<'All' | Role>('All')
  let statusFilter = $state<'All' | Status>('All')

  const filtered = $derived(
    rows.filter(r =>
      (!query || r.name.toLowerCase().includes(query.toLowerCase()) || r.email.toLowerCase().includes(query.toLowerCase()) || r.org.toLowerCase().includes(query.toLowerCase()))
      && (roleFilter === 'All' || r.role === roleFilter)
      && (statusFilter === 'All' || r.status === statusFilter)
    )
  )

  function initialsOf(name: string): string {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }

  function pillFor(status: Status): string {
    if (status === 'Active') return 'pill-green'
    if (status === 'Pending') return 'pill-blue'
    return 'pill-red'
  }
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/admin">Admin</a> <span>›</span> <span>Users</span>
  </nav>

  <header>
    <div>
      <h1>Users</h1>
      <p>Manage individual members, invite new ones, and assign roles.</p>
    </div>
    <div class="header-actions">
      <button class="ghost"><Icon name="download" size={16} /> Export</button>
      <button class="primary"><Icon name="plus" size={16} /> Invite User</button>
    </div>
  </header>

  <div class="main card">
    <div class="toolbar">
      <div class="search">
        <Icon name="search" size={16} />
        <input type="text" placeholder="Search name, email, or organization…" bind:value={query} />
      </div>
      <select bind:value={roleFilter}>
        <option value="All">All roles</option>
        <option>Super Admin</option>
        <option>Finance</option>
        <option>Sponsee Lead</option>
        <option>Board</option>
        <option>Member</option>
      </select>
      <select bind:value={statusFilter}>
        <option value="All">All statuses</option>
        <option>Active</option>
        <option>Pending</option>
        <option>Suspended</option>
      </select>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Organization</th>
            <th>Status</th>
            <th>Last login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as r (r.email)}
            <tr>
              <td>
                <div class="who">
                  <span class="avatar" aria-hidden="true">{initialsOf(r.name)}</span>
                  <div>
                    <span class="name">{r.name}</span>
                    <span class="email">{r.email}</span>
                  </div>
                </div>
              </td>
              <td><span class="role-tag">{r.role}</span></td>
              <td>{r.org}</td>
              <td><span class="pill {pillFor(r.status)}">{r.status}</span></td>
              <td class="muted">{r.lastLogin}</td>
              <td class="row-actions">
                <button aria-label="View"><Icon name="eye" size={16} /></button>
                <button aria-label="More"><Icon name="dots" size={16} /></button>
              </td>
            </tr>
          {/each}
          {#if filtered.length === 0}
            <tr><td colspan="6" class="empty">No users match the current filters.</td></tr>
          {/if}
        </tbody>
      </table>
    </div>

    <div class="footer-row">
      <span class="count">Showing {filtered.length} of {rows.length} users</span>
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

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  thead th {
    text-align: left; padding: 0.65rem 0.85rem;
    color: var(--cg-text-muted); font-weight: 500; font-size: 0.82rem;
    border-bottom: 1px solid var(--cg-border); white-space: nowrap;
  }
  tbody td { padding: 0.85rem; border-bottom: 1px solid var(--cg-border); color: var(--cg-text); }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--cg-bg); }

  .who { display: flex; gap: 0.7rem; align-items: center; }
  .avatar {
    width: 2.1rem; height: 2.1rem; border-radius: 50%;
    display: grid; place-items: center;
    background: linear-gradient(135deg, #b8d4be 0%, #6fa67e 100%);
    color: white; font-weight: 600; font-size: 0.78rem;
    flex-shrink: 0;
  }
  .name { display: block; font-weight: 500; }
  .email { display: block; font-size: 0.8rem; color: var(--cg-text-muted); }

  .role-tag {
    display: inline-block;
    padding: 0.18rem 0.55rem;
    background: var(--cg-bg); border: 1px solid var(--cg-border);
    border-radius: 999px; font-size: 0.78rem; color: var(--cg-text);
  }

  .pill { font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap; }
  .pill-green { background: rgba(30,122,58,0.12); color: var(--cg-green); }
  .pill-blue  { background: rgba(45,108,189,0.12); color: #2d6cbd; }
  .pill-red   { background: rgba(179,38,30,0.12); color: var(--cg-error); }

  .muted { color: var(--cg-text-muted); }

  .row-actions { display: flex; gap: 0.25rem; }
  .row-actions button {
    background: transparent; border: none; padding: 0.3rem; cursor: pointer;
    color: var(--cg-text-muted); border-radius: var(--cg-radius-sm);
  }
  .row-actions button:hover { background: var(--cg-bg); color: var(--cg-text); }

  .empty { text-align: center; padding: 2rem; color: var(--cg-text-muted); }
  .footer-row { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
  .count { color: var(--cg-text-muted); font-size: 0.85rem; }
</style>
