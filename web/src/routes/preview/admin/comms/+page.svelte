<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  type Status = 'Sent' | 'Scheduled' | 'Draft'

  const stats = [
    { label: 'Subscribers',        value: '342',    sub: 'Across 48 organizations', tone: 'green' },
    { label: 'Last broadcast',     value: '4 days', sub: '64% open rate',          tone: 'blue'  },
    { label: 'Scheduled',          value: '2',      sub: 'Next: bi-weekly update', tone: 'amber' },
    { label: 'Unsubscribed (30d)', value: '3',      sub: 'Below the 1% threshold', tone: 'red'   }
  ]

  type Tab = 'Broadcasts' | 'Templates' | 'Audiences' | 'Preferences'
  let tab = $state<Tab>('Broadcasts')

  const broadcasts: {
    subject: string; status: Status; audience: string;
    sentDate: string; openRate: string | null
  }[] = [
    { subject: 'May service update — banking improvements',          status: 'Sent',      audience: 'All members (342)',     sentDate: 'May 25, 2026',     openRate: '64%'  },
    { subject: 'Bi-weekly update — May highlights',                  status: 'Scheduled', audience: 'All members (342)',     sentDate: 'May 30, 2026',     openRate: null   },
    { subject: 'Fiscal sponsorship Q&A — invite',                    status: 'Sent',      audience: 'Sponsee leads (48)',    sentDate: 'May 20, 2026',     openRate: '78%'  },
    { subject: 'Affected user follow-up (banking delays)',           status: 'Sent',      audience: 'Affected only (6)',     sentDate: 'May 18, 2026',     openRate: '100%' },
    { subject: 'Draft: Q3 grants reporting reminders',               status: 'Draft',     audience: '—',                     sentDate: '—',                openRate: null   }
  ]

  const templates = [
    { title: 'Service update',     desc: 'For announcements about platform changes or processing updates.',  icon: 'shield' },
    { title: 'Bi-weekly update',   desc: 'Recurring digest of highlights, resources, and reminders.',        icon: 'chat'   },
    { title: 'Affected-user notice', desc: 'Direct outreach with a clear status and remediation step.',      icon: 'user'   },
    { title: 'Reminder',           desc: 'Light nudge for deadlines, document uploads, or open tasks.',     icon: 'clock'  }
  ]

  const audiences = [
    { name: 'All members',      count: 342, desc: 'Default broadcast audience.' },
    { name: 'Sponsee leads',    count: 48,  desc: 'Primary contact at each sponsored organization.' },
    { name: 'Finance contacts', count: 31,  desc: 'Anyone with the Finance role across orgs.' },
    { name: 'Affected only',    count: 6,   desc: 'Members impacted by the recent banking delays.' },
    { name: 'Board members',    count: 12,  desc: 'Board-level access across orgs.' }
  ]

  function pillFor(s: Status): string {
    if (s === 'Sent') return 'pill-green'
    if (s === 'Scheduled') return 'pill-blue'
    return 'pill-amber'
  }
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/admin">Admin</a> <span>›</span> <span>Communications</span>
  </nav>

  <header>
    <div>
      <h1>Communications</h1>
      <p>Send broadcasts, manage templates, and control audience targeting.</p>
    </div>
    <div class="header-actions">
      <button class="ghost"><Icon name="folder" size={16} /> Templates</button>
      <a class="primary" href="/preview/admin/comms/new"><Icon name="plus" size={16} /> New Broadcast</a>
    </div>
  </header>

  <section class="stats">
    {#each stats as s}
      <div class="card stat">
        <div class="stat-row">
          <span class="dot dot-{s.tone}"></span>
          <span class="stat-label">{s.label}</span>
        </div>
        <span class="stat-value">{s.value}</span>
        <span class="stat-sub">{s.sub}</span>
      </div>
    {/each}
  </section>

  <div class="card content">
    <div class="tabs">
      {#each ['Broadcasts','Templates','Audiences','Preferences'] as t}
        <button class:active={tab === t} onclick={() => (tab = t as Tab)}>{t}</button>
      {/each}
    </div>

    {#if tab === 'Broadcasts'}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Status</th>
              <th>Audience</th>
              <th>Sent / Scheduled</th>
              <th>Open rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each broadcasts as b}
              <tr>
                <td class="subject">{b.subject}</td>
                <td><span class="pill {pillFor(b.status)}">{b.status}</span></td>
                <td>{b.audience}</td>
                <td class="muted">{b.sentDate}</td>
                <td>{b.openRate ?? '—'}</td>
                <td class="row-actions">
                  <button aria-label="View"><Icon name="eye" size={16} /></button>
                  <button aria-label="More"><Icon name="dots" size={16} /></button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if tab === 'Templates'}
      <ul class="cards">
        {#each templates as t}
          <li>
            <div class="icon-wrap"><Icon name={t.icon} size={20} /></div>
            <div>
              <span class="card-title">{t.title}</span>
              <span class="card-desc">{t.desc}</span>
            </div>
            <button class="use">Use →</button>
          </li>
        {/each}
      </ul>
    {:else if tab === 'Audiences'}
      <ul class="cards">
        {#each audiences as a}
          <li>
            <div class="icon-wrap"><Icon name="user" size={20} /></div>
            <div>
              <span class="card-title">{a.name} <span class="count">· {a.count} members</span></span>
              <span class="card-desc">{a.desc}</span>
            </div>
            <button class="use">View →</button>
          </li>
        {/each}
      </ul>
    {:else if tab === 'Preferences'}
      <div class="prefs">
        <h3>Default preferences for new members</h3>
        <p>These set what members can opt in or out of. They can change their own preferences anytime.</p>
        <ul class="pref-list">
          <li>
            <label><input type="checkbox" checked /> <span><strong>Service updates</strong><small>Announcements about platform changes or incidents. Cannot be disabled.</small></span></label>
          </li>
          <li>
            <label><input type="checkbox" checked /> <span><strong>Bi-weekly updates</strong><small>Recurring digest of highlights, resources, and reminders.</small></span></label>
          </li>
          <li>
            <label><input type="checkbox" /> <span><strong>Marketing</strong><small>Events, partnerships, and fundraising appeals.</small></span></label>
          </li>
          <li>
            <label><input type="checkbox" /> <span><strong>Media-release inclusion</strong><small>Allow Common Good to feature this org in case studies and press materials.</small></span></label>
          </li>
        </ul>
      </div>
    {/if}
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
  .ghost { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.9rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.88rem; cursor: pointer; color: var(--cg-text); }
  .ghost:hover { border-color: var(--cg-green); }
  .primary { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.95rem; background: var(--cg-green); color: white; border: none; border-radius: var(--cg-radius-sm); font-size: 0.88rem; font-weight: 500; cursor: pointer; text-decoration: none; }
  .primary:hover { background: var(--cg-green-hover); text-decoration: none; }

  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }

  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .stat { padding: 1.1rem 1.25rem; display: grid; gap: 0.2rem; }
  .stat-row { display: flex; align-items: center; gap: 0.5rem; }
  .dot { width: 0.55rem; height: 0.55rem; border-radius: 50%; }
  .dot-green { background: var(--cg-green); } .dot-blue { background: #2d6cbd; } .dot-amber { background: #e89826; } .dot-red { background: var(--cg-error); }
  .stat-label { font-size: 0.82rem; font-weight: 500; color: var(--cg-text); }
  .stat-value { font-size: 1.4rem; font-weight: 700; color: var(--cg-text); letter-spacing: -0.01em; }
  .stat-sub { font-size: 0.78rem; color: var(--cg-text-muted); }

  .content { padding: 1.25rem; }
  .tabs { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--cg-border); margin: -0.5rem -1.25rem 1.25rem; padding: 0 1.25rem; }
  .tabs button { padding: 0.85rem 0.7rem; background: transparent; border: none; cursor: pointer; color: var(--cg-text-muted); font-size: 0.92rem; font-weight: 500; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .tabs button.active { color: var(--cg-green); border-bottom-color: var(--cg-green); }

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  thead th { text-align: left; padding: 0.65rem 0.85rem; color: var(--cg-text-muted); font-weight: 500; font-size: 0.82rem; border-bottom: 1px solid var(--cg-border); white-space: nowrap; }
  tbody td { padding: 0.85rem; border-bottom: 1px solid var(--cg-border); color: var(--cg-text); }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--cg-bg); }
  .subject { font-weight: 500; }
  .muted { color: var(--cg-text-muted); }
  .row-actions { display: flex; gap: 0.25rem; }
  .row-actions button { background: transparent; border: none; padding: 0.3rem; cursor: pointer; color: var(--cg-text-muted); border-radius: var(--cg-radius-sm); }
  .row-actions button:hover { background: var(--cg-bg); color: var(--cg-text); }

  .pill { font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap; }
  .pill-green { background: rgba(30,122,58,0.12); color: var(--cg-green); }
  .pill-blue  { background: rgba(45,108,189,0.12); color: #2d6cbd; }
  .pill-amber { background: rgba(214,143,30,0.14); color: #b96e0c; }

  .cards { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
  .cards li { display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; align-items: center; padding: 1rem 1.1rem; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); }
  .cards li:hover { border-color: var(--cg-green); background: var(--cg-bg); }
  .icon-wrap { width: 2.5rem; height: 2.5rem; border-radius: 50%; background: rgba(30,122,58,0.1); color: var(--cg-green); display: grid; place-items: center; }
  .card-title { display: block; font-weight: 600; font-size: 0.95rem; color: var(--cg-text); }
  .card-desc  { display: block; font-size: 0.85rem; color: var(--cg-text-muted); margin-top: 0.2rem; line-height: 1.4; }
  .count { color: var(--cg-text-muted); font-weight: 400; font-size: 0.85rem; }
  .use { padding: 0.4rem 0.85rem; background: transparent; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); cursor: pointer; font-size: 0.85rem; color: var(--cg-green); font-weight: 500; }
  .use:hover { border-color: var(--cg-green); background: rgba(30,122,58,0.05); }

  .prefs h3 { margin: 0 0 0.4rem; font-size: 1rem; font-weight: 600; }
  .prefs > p { margin: 0 0 1.25rem; color: var(--cg-text-muted); font-size: 0.9rem; }
  .pref-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.6rem; }
  .pref-list label { display: grid; grid-template-columns: auto 1fr; gap: 0.75rem; align-items: flex-start; padding: 0.85rem 1rem; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); cursor: pointer; }
  .pref-list label:hover { border-color: var(--cg-green); background: var(--cg-bg); }
  .pref-list input { accent-color: var(--cg-green); margin-top: 0.2rem; }
  .pref-list strong { display: block; font-size: 0.92rem; }
  .pref-list small { display: block; font-size: 0.8rem; color: var(--cg-text-muted); margin-top: 0.15rem; line-height: 1.4; }
</style>
