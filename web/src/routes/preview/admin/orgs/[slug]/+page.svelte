<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'
  import { page } from '$app/state'

  // Same fixture for every slug — this is a UI preview, not real data.
  // The slug is shown so it's clear the route is dynamic; real impl would key off it.
  const slug = $derived(page.params.slug)

  const org = {
    name: 'EarthSeed Consulting',
    legalName: 'EarthSeed Consulting, a California Public Benefit Corporation',
    status: 'Approved' as const,
    mission: 'Community-scale environmental consulting and stewardship — partnering with local governments, schools, and small businesses to design, fund, and run measurable sustainability programs.',
    primaryContact: { name: 'Jane Smith', email: 'jane@earthseed.org', phone: '+1 415 555 0142' },
    financeContact: { name: 'Devon Marsh', email: 'devon@earthseed.org', phone: '+1 415 555 0188' },
    location: 'Oakland, CA',
    taxId: '47-1234567',
    bankLinked: 'Plaid · ****4912',
    sponsorshipSince: 'Jan 12, 2024',
    grantsYTD: '$153,250',
    lastActivity: 'May 27, 2026',
    documentsCount: 24,
    activeMembers: 6
  }

  type Tab = 'Overview' | 'Grants' | 'Documents' | 'Activity' | 'Members'
  let tab = $state<Tab>('Overview')

  const grants = [
    { donor: 'Verizon Foundation',                  amount: '$25,000.00', status: 'Matched',  date: 'May 21, 2026', tone: 'green' },
    { donor: 'Community Foundation of Sonoma County', amount: '$10,000.00', status: 'Matched',  date: 'May 18, 2026', tone: 'green' },
    { donor: 'CL+P Distribution',                  amount: '$26,949.53', status: 'Needs Review', date: 'May 18, 2026', tone: 'amber' },
    { donor: 'Waverley Street Foundation',         amount: '$41,666.67', status: 'Unmatched', date: 'May 22, 2026', tone: 'red' },
    { donor: 'Enterprise for Youth',               amount: '$49,500.00', status: 'Pending',   date: 'Awaiting',     tone: 'blue' }
  ]

  const documents = [
    { name: 'Fiscal Sponsorship Agreement.pdf',   kind: 'Agreement', uploaded: 'Jan 12, 2024', by: 'Jane Smith' },
    { name: 'IRS Determination Letter.pdf',       kind: 'Tax',       uploaded: 'Jan 12, 2024', by: 'Jane Smith' },
    { name: 'Award Letter — Community Food Initiative.pdf', kind: 'Grant',     uploaded: 'May 15, 2026', by: 'Jane Smith' },
    { name: 'Q1 2026 Activity Summary.pdf',       kind: 'Report',    uploaded: 'Apr 04, 2026', by: 'Devon Marsh' }
  ]

  const activity = [
    { tone: 'green', text: 'Verizon Foundation grant matched to expected ($25,000)',                   when: 'May 21, 2026 · 11:23 AM' },
    { tone: 'amber', text: 'CL+P Distribution deposit needs review — amount mismatch',                  when: 'May 20, 2026 · 9:57 AM' },
    { tone: 'blue',  text: 'Document uploaded: Award Letter — Community Food Initiative',              when: 'May 15, 2026 · 4:08 PM' },
    { tone: 'blue',  text: 'Transfer request of $10,000 submitted',                                    when: 'May 18, 2026 · 10:14 AM' },
    { tone: 'green', text: 'Sponsorship renewed for 2026',                                             when: 'Jan 10, 2026 · 8:00 AM' }
  ]

  const members = [
    { name: 'Jane Smith',  role: 'Sponsee Lead', email: 'jane@earthseed.org',  active: true },
    { name: 'Devon Marsh', role: 'Finance',      email: 'devon@earthseed.org', active: true },
    { name: 'Sam Reyes',   role: 'Member',       email: 'sam@earthseed.org',   active: true }
  ]

  function pillFor(tone: string): string {
    if (tone === 'green') return 'pill-green'
    if (tone === 'blue')  return 'pill-blue'
    if (tone === 'amber') return 'pill-amber'
    return 'pill-red'
  }

  function initialsOf(name: string): string {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/admin">Admin</a> <span>›</span>
    <a href="/preview/admin/orgs">Sponsored Organizations</a> <span>›</span>
    <span>{org.name}</span>
  </nav>

  <section class="hero card">
    <div class="hero-main">
      <div class="hero-id">
        <div class="avatar">{initialsOf(org.name)}</div>
        <div>
          <h1>{org.name}</h1>
          <span class="legal">{org.legalName} <span class="muted">· slug: {slug}</span></span>
        </div>
      </div>
      <div class="hero-actions">
        <span class="pill pill-green">{org.status}</span>
        <button class="ghost"><Icon name="chat" size={14} /> Message</button>
        <button class="ghost"><Icon name="dots" size={14} /></button>
      </div>
    </div>

    <dl class="hero-meta">
      <div><dt>Sponsorship since</dt><dd>{org.sponsorshipSince}</dd></div>
      <div><dt>Grants YTD</dt><dd>{org.grantsYTD}</dd></div>
      <div><dt>Last activity</dt><dd>{org.lastActivity}</dd></div>
      <div><dt>Location</dt><dd>{org.location}</dd></div>
      <div><dt>Tax ID</dt><dd>{org.taxId}</dd></div>
      <div><dt>Bank</dt><dd>{org.bankLinked}</dd></div>
    </dl>
  </section>

  <div class="card content">
    <div class="tabs">
      {#each ['Overview','Grants','Documents','Activity','Members'] as t}
        <button class:active={tab === t} onclick={() => (tab = t as Tab)}>{t}</button>
      {/each}
    </div>

    {#if tab === 'Overview'}
      <div class="overview">
        <section>
          <h3>Mission</h3>
          <p>{org.mission}</p>
        </section>

        <section>
          <h3>Key contacts</h3>
          <ul class="contacts">
            <li>
              <span class="role">Primary contact</span>
              <strong>{org.primaryContact.name}</strong>
              <span>{org.primaryContact.email} · {org.primaryContact.phone}</span>
            </li>
            <li>
              <span class="role">Finance contact</span>
              <strong>{org.financeContact.name}</strong>
              <span>{org.financeContact.email} · {org.financeContact.phone}</span>
            </li>
          </ul>
        </section>

        <section class="overview-cards">
          <a class="ov-card" href="/preview/admin/orgs/{slug}" onclick={() => (tab = 'Grants')}>
            <span class="ov-label">Grants</span>
            <span class="ov-value">{grants.length}</span>
            <span class="ov-sub">View grant history →</span>
          </a>
          <a class="ov-card" href="/preview/admin/orgs/{slug}" onclick={() => (tab = 'Documents')}>
            <span class="ov-label">Documents</span>
            <span class="ov-value">{org.documentsCount}</span>
            <span class="ov-sub">Browse documents →</span>
          </a>
          <a class="ov-card" href="/preview/admin/orgs/{slug}" onclick={() => (tab = 'Members')}>
            <span class="ov-label">Active members</span>
            <span class="ov-value">{org.activeMembers}</span>
            <span class="ov-sub">Manage members →</span>
          </a>
        </section>
      </div>
    {:else if tab === 'Grants'}
      <table>
        <thead>
          <tr><th>Donor / Funder</th><th>Amount</th><th>Status</th><th>Date</th></tr>
        </thead>
        <tbody>
          {#each grants as g}
            <tr>
              <td>{g.donor}</td>
              <td>{g.amount}</td>
              <td><span class="pill {pillFor(g.tone)}">{g.status}</span></td>
              <td class="muted">{g.date}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else if tab === 'Documents'}
      <ul class="doc-list">
        {#each documents as d}
          <li>
            <div class="doc-icon"><Icon name="folder" size={18} /></div>
            <div class="doc-body">
              <span class="doc-name">{d.name}</span>
              <span class="doc-meta">{d.kind} · uploaded {d.uploaded} by {d.by}</span>
            </div>
            <button class="ghost-sm"><Icon name="download" size={14} /></button>
          </li>
        {/each}
      </ul>
    {:else if tab === 'Activity'}
      <ul class="activity">
        {#each activity as a}
          <li>
            <span class="dot dot-{a.tone}"></span>
            <div>
              <span class="act-text">{a.text}</span>
              <span class="act-when">{a.when}</span>
            </div>
          </li>
        {/each}
      </ul>
    {:else if tab === 'Members'}
      <table>
        <thead>
          <tr><th>Name</th><th>Role</th><th>Email</th><th>Status</th></tr>
        </thead>
        <tbody>
          {#each members as m}
            <tr>
              <td>{m.name}</td>
              <td>{m.role}</td>
              <td class="muted">{m.email}</td>
              <td><span class="pill {m.active ? 'pill-green' : 'pill-red'}">{m.active ? 'Active' : 'Inactive'}</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .container { max-width: 1280px; margin: 0 auto; padding: 1.5rem 1.75rem 3rem; }
  .crumbs { font-size: 0.85rem; color: var(--cg-text-muted); margin-bottom: 1rem; }
  .crumbs a { color: var(--cg-green); }
  .crumbs span { margin: 0 0.5rem; }

  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }
  .hero { padding: 1.5rem; margin-bottom: 1.5rem; }
  .hero-main { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
  .hero-id { display: flex; gap: 1rem; align-items: center; }
  .avatar { width: 3.25rem; height: 3.25rem; border-radius: 50%; background: linear-gradient(135deg, #b8d4be 0%, #6fa67e 100%); color: white; display: grid; place-items: center; font-weight: 700; font-size: 1.05rem; flex-shrink: 0; }
  .hero h1 { margin: 0 0 0.2rem; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.01em; }
  .legal { font-size: 0.85rem; color: var(--cg-text-muted); }
  .muted { color: var(--cg-text-muted); }
  .hero-actions { display: flex; gap: 0.5rem; align-items: center; }
  .ghost { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.85rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.85rem; cursor: pointer; color: var(--cg-text); }
  .ghost:hover { border-color: var(--cg-green); }

  .hero-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.5rem 1rem; padding: 1rem; background: var(--cg-bg); border-radius: var(--cg-radius-sm); margin: 0; }
  .hero-meta div { display: grid; gap: 0.15rem; }
  dt { font-size: 0.7rem; color: var(--cg-text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
  dd { margin: 0; font-size: 0.9rem; font-weight: 500; color: var(--cg-text); }

  .content { padding: 1.25rem; }
  .tabs { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--cg-border); margin: -0.5rem -1.25rem 1.25rem; padding: 0 1.25rem; }
  .tabs button { padding: 0.85rem 0.7rem; background: transparent; border: none; cursor: pointer; color: var(--cg-text-muted); font-size: 0.92rem; font-weight: 500; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .tabs button.active { color: var(--cg-green); border-bottom-color: var(--cg-green); }

  .overview { display: grid; gap: 1.5rem; }
  .overview h3 { margin: 0 0 0.5rem; font-size: 0.95rem; font-weight: 600; }
  .overview p { margin: 0; color: var(--cg-text-muted); line-height: 1.55; }

  .contacts { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
  @media (max-width: 700px) { .contacts { grid-template-columns: 1fr; } }
  .contacts li { display: grid; gap: 0.25rem; padding: 0.85rem 1rem; background: var(--cg-bg); border-radius: var(--cg-radius-sm); }
  .role { font-size: 0.72rem; color: var(--cg-text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
  .contacts strong { font-size: 0.95rem; }
  .contacts span:last-child { font-size: 0.82rem; color: var(--cg-text-muted); }

  .overview-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.85rem; margin: 0; }
  .ov-card { display: grid; gap: 0.25rem; padding: 1rem 1.1rem; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); text-decoration: none; color: inherit; transition: border-color 0.15s; }
  .ov-card:hover { border-color: var(--cg-green); }
  .ov-label { font-size: 0.82rem; color: var(--cg-text-muted); }
  .ov-value { font-size: 1.5rem; font-weight: 700; color: var(--cg-text); }
  .ov-sub { font-size: 0.82rem; color: var(--cg-green); }

  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  thead th { text-align: left; padding: 0.65rem 0.85rem; color: var(--cg-text-muted); font-weight: 500; font-size: 0.82rem; border-bottom: 1px solid var(--cg-border); }
  tbody td { padding: 0.85rem; border-bottom: 1px solid var(--cg-border); }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--cg-bg); }

  .pill { font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap; }
  .pill-green { background: rgba(30,122,58,0.12); color: var(--cg-green); }
  .pill-blue  { background: rgba(45,108,189,0.12); color: #2d6cbd; }
  .pill-amber { background: rgba(214,143,30,0.14); color: #b96e0c; }
  .pill-red   { background: rgba(179,38,30,0.12); color: var(--cg-error); }

  .doc-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
  .doc-list li { display: grid; grid-template-columns: auto 1fr auto; gap: 0.85rem; align-items: center; padding: 0.75rem 1rem; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); }
  .doc-list li:hover { border-color: var(--cg-green); background: var(--cg-bg); }
  .doc-icon { color: var(--cg-green); }
  .doc-body { display: grid; gap: 0.15rem; }
  .doc-name { font-size: 0.92rem; font-weight: 500; }
  .doc-meta { font-size: 0.78rem; color: var(--cg-text-muted); }
  .ghost-sm { padding: 0.4rem; background: transparent; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); cursor: pointer; color: var(--cg-text-muted); }
  .ghost-sm:hover { color: var(--cg-text); border-color: var(--cg-green); }

  .activity { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.6rem; }
  .activity li { display: grid; grid-template-columns: auto 1fr; gap: 0.85rem; padding: 0.75rem 1rem; background: var(--cg-bg); border-radius: var(--cg-radius-sm); }
  .dot { width: 0.6rem; height: 0.6rem; border-radius: 50%; margin-top: 0.3rem; }
  .dot-green { background: var(--cg-green); }
  .dot-blue { background: #2d6cbd; }
  .dot-amber { background: #e89826; }
  .dot-red { background: var(--cg-error); }
  .act-text { display: block; font-size: 0.92rem; line-height: 1.4; }
  .act-when { display: block; font-size: 0.78rem; color: var(--cg-text-muted); margin-top: 0.15rem; }
</style>
