<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  // Overview cards — high-signal counts Jose mentioned in his email.
  const overview = [
    { label: 'Users',            value: '342',      delta: '+12 this week', icon: 'user',      tone: 'green',  href: '/preview/admin/users' },
    { label: 'Organizations',    value: '48',       delta: '+2 this month', icon: 'bank',      tone: 'blue',   href: '/preview/admin/orgs' },
    { label: 'Pending Deposits', value: '$248,750', delta: '14 grants',     icon: 'clock',     tone: 'amber',  href: '/preview/grants' },
    { label: 'Alerts',           value: '5',        delta: 'Action needed', icon: 'shield',    tone: 'red',    href: '/preview/admin/alerts' }
  ]

  // Workflow-based large action cards — replaces the old long button list.
  const actions = [
    { title: 'Users',                 desc: 'Manage individual members, invite, and assign roles.',          icon: 'user',      href: '/preview/admin/users' },
    { title: 'Sponsored Organizations', desc: 'View sponsees, applications, and compliance status.',         icon: 'bank',      href: '/preview/admin/orgs' },
    { title: 'Expected Grants',       desc: 'Add expected grants, view incoming funding notifications.',     icon: 'download',  href: '/preview/grants' },
    { title: 'Reports',               desc: 'Financial, sponsorship, and activity reports.',                 icon: 'folder',    href: '/preview/admin/reports' },
    { title: 'Settings',              desc: 'System configuration, branding, and policy.',                   icon: 'shield',    href: '/preview/admin/settings' },
    { title: 'Communications',        desc: 'Member email, broadcasts, and notification preferences.',       icon: 'chat',      href: '/preview/admin/comms' }
  ]

  // Secondary functions — hidden behind a disclosure so the main view stays clean.
  const advanced = [
    { title: 'Reauthorize QBO', desc: 'Reconnect QuickBooks Online integration.' },
    { title: 'Connections',     desc: 'Manage third-party integrations.' },
    { title: 'State Reports',   desc: 'Generate per-state activity exports.' },
    { title: 'SMT',             desc: 'Strategic management tools.' },
    { title: 'Categories',      desc: 'Edit taxonomy and tags.' }
  ]
  let advancedOpen = $state(false)

  // Recent alerts — quick triage at the bottom.
  const alerts = [
    { tone: 'red',   text: 'CL+P Distribution deposit amount mismatch ($26,949.53 vs $26,000.00 expected)', when: 'May 20, 2026 · 9:57 AM' },
    { tone: 'amber', text: 'Enterprise for Youth grant overdue — expected May 19', when: 'May 19, 2026 · 2:15 PM' },
    { tone: 'amber', text: 'New sponsee application from "Pacific Forest Coalition" awaiting review', when: 'May 18, 2026 · 11:02 AM' }
  ]
</script>

<div class="hero">
  <div class="hero-inner">
    <span class="role">Super Admin</span>
    <h1>Good morning, William.</h1>
    <p>Here's what needs your attention today.</p>
  </div>
</div>

<div class="container">
  <!-- Overview cards -->
  <section class="overview">
    {#each overview as o}
      <a class="card overview-card" href={o.href}>
        <div class="icon-wrap tone-{o.tone}">
          <Icon name={o.icon} size={20} />
        </div>
        <div class="ov-body">
          <span class="label">{o.label}</span>
          <span class="value">{o.value}</span>
          <span class="delta tone-text-{o.tone}">{o.delta}</span>
        </div>
        <Icon name="arrow" size={16} class="ov-chev" />
      </a>
    {/each}
  </section>

  <!-- Large action cards -->
  <section class="actions">
    <h2>What would you like to do?</h2>
    <div class="action-grid">
      {#each actions as a}
        <a class="card action-card" href={a.href} title={a.desc}>
          <div class="icon-wrap tone-green large">
            <Icon name={a.icon} size={24} />
          </div>
          <div>
            <span class="action-title">{a.title}</span>
            <span class="action-desc">{a.desc}</span>
          </div>
          <Icon name="arrow" size={16} class="action-chev" />
        </a>
      {/each}
    </div>
  </section>

  <!-- Two-column: alerts + advanced tools -->
  <section class="lower">
    <div class="card alerts-card">
      <h3>Recent alerts</h3>
      <ul>
        {#each alerts as a}
          <li>
            <span class="dot dot-{a.tone}" aria-hidden="true"></span>
            <div>
              <span class="alert-text">{a.text}</span>
              <span class="alert-when">{a.when}</span>
            </div>
          </li>
        {/each}
      </ul>
      <a class="view-all" href="/preview/admin/alerts">View all alerts →</a>
    </div>

    <div class="card advanced-card">
      <button
        class="advanced-toggle"
        onclick={() => (advancedOpen = !advancedOpen)}
        aria-expanded={advancedOpen}
      >
        <span>Advanced Tools</span>
        <Icon name={advancedOpen ? 'x' : 'plus'} size={16} />
      </button>
      {#if advancedOpen}
        <ul class="advanced-list">
          {#each advanced as a}
            <li>
              <a href="/preview" title={a.desc}>
                <span class="adv-title">{a.title}</span>
                <span class="adv-desc">{a.desc}</span>
              </a>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="advanced-hint">Reauthorize QBO, Connections, State Reports, SMT, Categories</p>
      {/if}
    </div>
  </section>
</div>

<style>
  .hero {
    background:
      linear-gradient(to right, rgba(245,247,244,1) 0%, rgba(245,247,244,0.6) 60%, rgba(245,247,244,0) 100%),
      linear-gradient(180deg, #eaf1ea 0%, #f5f7f4 100%);
    padding: 2.25rem 0 3.25rem;
    border-bottom: 1px solid var(--cg-border);
  }
  .hero-inner { max-width: 1280px; margin: 0 auto; padding: 0 1.75rem; }
  .role {
    display: inline-block;
    padding: 0.2rem 0.7rem;
    background: rgba(30,122,58,0.12);
    color: var(--cg-green);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-radius: 999px;
    margin-bottom: 0.75rem;
  }
  .hero h1 { margin: 0 0 0.3rem; font-size: 2rem; font-weight: 600; letter-spacing: -0.01em; }
  .hero p { margin: 0; color: var(--cg-text-muted); }

  .container { max-width: 1280px; margin: -2rem auto 3rem; padding: 0 1.75rem; display: grid; gap: 1.75rem; }

  .card {
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: var(--cg-shadow);
  }

  .overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }
  .overview-card {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    padding: 1.25rem;
    align-items: center;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s, transform 0.15s;
  }
  .overview-card:hover { border-color: var(--cg-green); transform: translateY(-2px); }
  .icon-wrap {
    width: 2.75rem; height: 2.75rem; border-radius: 50%;
    display: grid; place-items: center; flex-shrink: 0;
  }
  .icon-wrap.large { width: 3.25rem; height: 3.25rem; }
  .tone-green { background: rgba(30,122,58,0.1); color: var(--cg-green); }
  .tone-blue  { background: rgba(45,108,189,0.1); color: #2d6cbd; }
  .tone-amber { background: rgba(214,143,30,0.12); color: #b96e0c; }
  .tone-red   { background: rgba(179,38,30,0.1); color: var(--cg-error); }

  .tone-text-green { color: var(--cg-green); }
  .tone-text-blue  { color: #2d6cbd; }
  .tone-text-amber { color: #b96e0c; }
  .tone-text-red   { color: var(--cg-error); }

  .ov-body { display: grid; gap: 0.15rem; }
  .label { font-size: 0.85rem; color: var(--cg-text-muted); font-weight: 500; }
  .value { font-size: 1.4rem; font-weight: 700; color: var(--cg-text); letter-spacing: -0.01em; }
  .delta { font-size: 0.78rem; font-weight: 500; }
  :global(.ov-chev), :global(.action-chev) { color: var(--cg-text-muted); }

  .actions h2 { margin: 0 0 1rem; font-size: 1.1rem; font-weight: 600; letter-spacing: -0.005em; }
  .action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
  }
  .action-card {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    padding: 1.25rem;
    align-items: center;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  }
  .action-card:hover {
    border-color: var(--cg-green);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.04), 0 12px 28px rgba(0,0,0,0.08);
  }
  .action-title { display: block; font-weight: 600; font-size: 1rem; color: var(--cg-text); margin-bottom: 0.2rem; }
  .action-desc { display: block; font-size: 0.85rem; color: var(--cg-text-muted); line-height: 1.4; }

  .lower {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 1rem;
    align-items: flex-start;
  }
  @media (max-width: 900px) { .lower { grid-template-columns: 1fr; } }

  .alerts-card { padding: 1.5rem; }
  .alerts-card h3 { margin: 0 0 1rem; font-size: 1rem; font-weight: 600; }
  .alerts-card ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.85rem; }
  .alerts-card li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.85rem;
    padding: 0.75rem 0.85rem;
    border-radius: var(--cg-radius-sm);
    background: var(--cg-bg);
  }
  .dot { width: 0.65rem; height: 0.65rem; border-radius: 50%; margin-top: 0.3rem; }
  .dot-red   { background: var(--cg-error); }
  .dot-amber { background: #e89826; }
  .dot-green { background: var(--cg-green); }
  .alert-text { display: block; font-size: 0.92rem; color: var(--cg-text); line-height: 1.35; }
  .alert-when { display: block; font-size: 0.78rem; color: var(--cg-text-muted); margin-top: 0.15rem; }
  .view-all { display: inline-block; margin-top: 1rem; font-size: 0.9rem; color: var(--cg-green); }

  .advanced-card { padding: 1.25rem; }
  .advanced-toggle {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    color: var(--cg-text);
  }
  .advanced-hint {
    margin: 0.4rem 0 0;
    color: var(--cg-text-muted);
    font-size: 0.85rem;
    line-height: 1.5;
  }
  .advanced-list {
    list-style: none;
    padding: 0;
    margin: 0.75rem 0 0;
    display: grid;
    gap: 0.4rem;
  }
  .advanced-list a {
    display: grid;
    gap: 0.15rem;
    padding: 0.65rem 0.85rem;
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s, background 0.15s;
  }
  .advanced-list a:hover { border-color: var(--cg-green); background: var(--cg-bg); }
  .adv-title { font-weight: 600; font-size: 0.88rem; color: var(--cg-text); }
  .adv-desc  { font-size: 0.8rem; color: var(--cg-text-muted); }
</style>
