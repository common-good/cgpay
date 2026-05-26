<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  const summary = [
    { label: 'Available Funds', value: '$48,250.75', icon: 'bank', cta: 'View details', tone: 'green' },
    { label: 'Pending Deposits', value: '$125,000.00', icon: 'clock', cta: 'View details', tone: 'blue' },
    { label: 'Pending Requests', value: '2', icon: 'clipboard', cta: 'View details', tone: 'amber' },
    { label: 'Unread Messages', value: '1', icon: 'chat', cta: 'View message', tone: 'purple' }
  ]

  const actions = [
    { title: 'Report Expected Grant', desc: 'Notify us about incoming funding.', icon: 'plus', href: '/preview/grants/new' },
    { title: 'Request Transfer', desc: 'Request funds be transferred.', icon: 'bank', href: '/preview' },
    { title: 'Documents', desc: 'Upload and manage your documents.', icon: 'folder', href: '/preview' },
    { title: 'Messages', desc: 'Message Common Good staff.', icon: 'chat', href: '/preview' },
    { title: 'Profile', desc: 'Update your organization profile.', icon: 'user', href: '/preview' }
  ]

  const recent = [
    { icon: 'download', text: 'Reported grant from Verizon Foundation for $25,000', date: 'May 21, 2026', status: 'Pending', tone: 'blue' },
    { icon: 'check', text: 'Transfer request of $10,000 submitted', date: 'May 18, 2026', status: 'Approved', tone: 'green' },
    { icon: 'upload', text: 'Document uploaded: Award Letter — Community Food Initiative', date: 'May 15, 2026', status: null, tone: null }
  ]
</script>

<div class="hero">
  <div class="hero-inner">
    <h1>Welcome back, Jane!</h1>
    <p>Here's what's happening with EarthSeed Consulting.</p>
  </div>
</div>

<div class="container">
  <section class="summary">
    {#each summary as s}
      <article class="card summary-card">
        <div class="icon-wrap tone-{s.tone}">
          <Icon name={s.icon} size={20} />
        </div>
        <div class="card-body">
          <span class="label">{s.label}</span>
          <span class="value">{s.value}</span>
          <a class="cta" href="/preview">{s.cta} →</a>
        </div>
      </article>
    {/each}
  </section>

  <section class="actions card">
    <h2>Quick Actions</h2>
    <ul>
      {#each actions as a}
        <li>
          <a href={a.href}>
            <div class="icon-wrap tone-green">
              <Icon name={a.icon} size={20} />
            </div>
            <div>
              <span class="action-title">{a.title}</span>
              <span class="action-desc">{a.desc}</span>
            </div>
          </a>
        </li>
      {/each}
    </ul>
  </section>

  <section class="bottom">
    <div class="recent card">
      <h2>Recent Actions</h2>
      <ul>
        {#each recent as r}
          <li>
            <div class="icon-wrap tone-soft"><Icon name={r.icon} size={18} /></div>
            <span class="text">{r.text}</span>
            {#if r.status}
              <span class="pill pill-{r.tone}">{r.status}</span>
            {/if}
            <span class="date">{r.date}</span>
            <Icon name="arrow" size={16} class="chev" />
          </li>
        {/each}
      </ul>
      <a class="view-all" href="/preview">View all activity →</a>
    </div>

    <aside class="help card">
      <h3>Need help?</h3>
      <p>Our team is here for you.</p>
      <button class="primary"><Icon name="help" size={16} /> Contact Support</button>
      <a href="/preview" class="help-link">Visit our Help Center →</a>
    </aside>
  </section>

  <div class="footer-tip card">
    <Icon name="help" size={18} />
    <span>Have questions about reporting a grant? <a href="/preview">View our FAQ →</a></span>
  </div>
</div>

<style>
  .hero {
    background:
      linear-gradient(to right, rgba(245,247,244,1) 0%, rgba(245,247,244,0.6) 60%, rgba(245,247,244,0) 100%),
      linear-gradient(180deg, #eaf1ea 0%, #f5f7f4 100%);
    padding: 2.5rem 0 3.5rem;
    border-bottom: 1px solid var(--cg-border);
  }
  .hero-inner { max-width: 1280px; margin: 0 auto; padding: 0 1.75rem; }
  .hero h1 { margin: 0 0 0.4rem; font-size: 2rem; font-weight: 600; letter-spacing: -0.01em; }
  .hero p { margin: 0; color: var(--cg-text-muted); }

  .container { max-width: 1280px; margin: -2rem auto 3rem; padding: 0 1.75rem; display: grid; gap: 1.5rem; }

  .card {
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: var(--cg-shadow);
  }

  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
  .summary-card { display: flex; gap: 1rem; padding: 1.25rem; align-items: flex-start; }
  .icon-wrap {
    flex-shrink: 0;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    display: grid;
    place-items: center;
  }
  .tone-green { background: rgba(30,122,58,0.1); color: var(--cg-green); }
  .tone-blue  { background: rgba(45,108,189,0.1); color: #2d6cbd; }
  .tone-amber { background: rgba(214,143,30,0.12); color: #b96e0c; }
  .tone-purple{ background: rgba(120,80,180,0.1); color: #785ab4; }
  .tone-soft  { background: var(--cg-bg); color: var(--cg-text-muted); }

  .card-body { display: grid; gap: 0.25rem; }
  .label { font-size: 0.85rem; color: var(--cg-text-muted); font-weight: 500; }
  .value { font-size: 1.4rem; font-weight: 700; color: var(--cg-text); letter-spacing: -0.01em; }
  .cta { font-size: 0.85rem; color: var(--cg-green); font-weight: 500; margin-top: 0.25rem; }

  .actions { padding: 1.5rem; }
  .actions h2 { margin: 0 0 1rem; font-size: 1rem; font-weight: 600; }
  .actions ul { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; }
  .actions li a {
    display: flex;
    gap: 0.85rem;
    padding: 1rem;
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s;
    align-items: flex-start;
  }
  .actions li a:hover { border-color: var(--cg-green); }
  .action-title { display: block; font-weight: 600; font-size: 0.9rem; color: var(--cg-text); margin-bottom: 0.15rem; }
  .action-desc { display: block; font-size: 0.8rem; color: var(--cg-text-muted); line-height: 1.35; }

  .bottom { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; }
  @media (max-width: 900px) { .bottom { grid-template-columns: 1fr; } }

  .recent { padding: 1.5rem; }
  .recent h2 { margin: 0 0 1rem; font-size: 1rem; font-weight: 600; }
  .recent ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
  .recent li {
    display: grid;
    grid-template-columns: auto 1fr auto auto auto;
    gap: 0.85rem;
    align-items: center;
    padding: 0.75rem 0.85rem;
    border-radius: var(--cg-radius-sm);
    transition: background 0.15s;
    cursor: pointer;
  }
  .recent li:hover { background: var(--cg-bg); }
  .text { font-size: 0.9rem; color: var(--cg-text); }
  .date { font-size: 0.82rem; color: var(--cg-text-muted); }
  .pill {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
  }
  .pill-blue   { background: rgba(45,108,189,0.12); color: #2d6cbd; }
  .pill-green  { background: rgba(30,122,58,0.12);  color: var(--cg-green); }
  .pill-amber  { background: rgba(214,143,30,0.14); color: #b96e0c; }
  .pill-red    { background: rgba(179,38,30,0.12);  color: var(--cg-error); }
  :global(.chev) { color: var(--cg-text-muted); }
  .view-all { display: inline-block; margin-top: 0.85rem; font-size: 0.9rem; color: var(--cg-green); }

  .help { padding: 1.5rem; background: linear-gradient(180deg, #e9efe9 0%, #f0f4f0 100%); }
  .help h3 { margin: 0 0 0.4rem; font-size: 1rem; font-weight: 600; }
  .help p { margin: 0 0 1rem; color: var(--cg-text-muted); font-size: 0.9rem; }
  .primary {
    width: 100%;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    justify-content: center;
    padding: 0.65rem 1rem;
    background: var(--cg-surface);
    color: var(--cg-text);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    cursor: pointer;
    font-weight: 500;
  }
  .primary:hover { border-color: var(--cg-green); }
  .help-link { display: inline-block; margin-top: 0.85rem; font-size: 0.9rem; color: var(--cg-green); }

  .footer-tip {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.85rem 1.25rem;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    color: var(--cg-text-muted);
    font-size: 0.9rem;
  }
  .footer-tip a { color: var(--cg-green); }
</style>
