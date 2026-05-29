<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  // Settings are grouped by area so admins can find what they're looking for at a glance.
  // Each section is a card with a short description + a couple of representative controls.
  const sections = [
    { id: 'org',           title: 'Organization profile',     icon: 'bank',     desc: 'Legal name, address, tax ID, and primary contact for Common Good.' },
    { id: 'branding',      title: 'Branding',                 icon: 'shield',   desc: 'Logo, colors, and the wordmark used in emails and the member dashboard.' },
    { id: 'notifications', title: 'Notification defaults',    icon: 'chat',     desc: 'What members opt in to by default and the bi-weekly update schedule.' },
    { id: 'integrations',  title: 'Integrations',             icon: 'folder',   desc: 'QuickBooks Online, Postmark, Mailerlite, and other connected services.' },
    { id: 'billing',       title: 'Billing & plan',           icon: 'download', desc: 'Plan tier, current usage, and payment method.' },
    { id: 'security',      title: 'Security',                 icon: 'user',     desc: 'Admin roles, sign-in policy, and audit log retention.' }
  ]

  // System status — quick health view at the top.
  const health = [
    { label: 'Postmark (email)',  status: 'OK',       tone: 'green' },
    { label: 'MariaDB',           status: 'OK',       tone: 'green' },
    { label: 'QuickBooks Online', status: 'Needs reauth', tone: 'amber' },
    { label: 'Backups',           status: 'OK',       tone: 'green' }
  ]
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/admin">Admin</a> <span>›</span> <span>Settings</span>
  </nav>

  <header>
    <div>
      <h1>Settings</h1>
      <p>System configuration, branding, and policy for Common Good.</p>
    </div>
    <div class="header-actions">
      <button class="ghost"><Icon name="download" size={16} /> Export config</button>
    </div>
  </header>

  <section class="health card">
    <div class="health-head">
      <h3>System status</h3>
      <span class="muted">Updated 2 minutes ago</span>
    </div>
    <ul>
      {#each health as h}
        <li>
          <span class="dot dot-{h.tone}"></span>
          <span class="h-label">{h.label}</span>
          <span class="h-status tone-text-{h.tone}">{h.status}</span>
        </li>
      {/each}
    </ul>
  </section>

  <section class="grid">
    {#each sections as s}
      <article class="card section-card">
        <div class="head">
          <div class="icon-wrap"><Icon name={s.icon} size={20} /></div>
          <h2>{s.title}</h2>
        </div>
        <p>{s.desc}</p>
        <a class="open" href="/preview/admin/settings">Configure →</a>
      </article>
    {/each}
  </section>
</div>

<style>
  .container { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1.75rem 3rem; }
  .crumbs { font-size: 0.85rem; color: var(--cg-text-muted); margin-bottom: 1rem; }
  .crumbs a { color: var(--cg-green); }
  .crumbs span { margin: 0 0.5rem; }

  header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; gap: 1rem; }
  header h1 { margin: 0 0 0.2rem; font-size: 1.6rem; font-weight: 600; letter-spacing: -0.01em; }
  header p { margin: 0; color: var(--cg-text-muted); font-size: 0.9rem; }
  .ghost { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.9rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.88rem; cursor: pointer; color: var(--cg-text); }
  .ghost:hover { border-color: var(--cg-green); }

  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }

  .health { padding: 1.1rem 1.25rem; margin-bottom: 1.5rem; }
  .health-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; }
  .health h3 { margin: 0; font-size: 0.95rem; font-weight: 600; }
  .muted { color: var(--cg-text-muted); font-size: 0.78rem; }
  .health ul { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.5rem 1rem; }
  .health li { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0; }
  .h-label { font-size: 0.88rem; color: var(--cg-text); flex: 1; }
  .h-status { font-size: 0.82rem; font-weight: 600; }

  .dot { width: 0.55rem; height: 0.55rem; border-radius: 50%; }
  .dot-green { background: var(--cg-green); }
  .dot-amber { background: #e89826; }
  .dot-red   { background: var(--cg-error); }
  .tone-text-green { color: var(--cg-green); }
  .tone-text-amber { color: #b96e0c; }
  .tone-text-red   { color: var(--cg-error); }

  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
  .section-card { padding: 1.25rem; display: grid; gap: 0.6rem; transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s; }
  .section-card:hover { border-color: var(--cg-green); transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.04), 0 12px 28px rgba(0,0,0,0.06); }
  .head { display: flex; align-items: center; gap: 0.75rem; }
  .icon-wrap { width: 2.4rem; height: 2.4rem; border-radius: 50%; background: rgba(30,122,58,0.1); color: var(--cg-green); display: grid; place-items: center; }
  .section-card h2 { margin: 0; font-size: 1.05rem; font-weight: 600; color: var(--cg-text); }
  .section-card p { margin: 0; font-size: 0.88rem; color: var(--cg-text-muted); line-height: 1.45; }
  .open { margin-top: 0.5rem; color: var(--cg-green); font-weight: 500; font-size: 0.9rem; text-decoration: none; }
  .open:hover { text-decoration: underline; }
</style>
