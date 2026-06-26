<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  type Category = 'Financial' | 'Sponsorship' | 'Activity' | 'Compliance'

  const reports: { title: string; desc: string; category: Category; lastRun: string; icon: string }[] = [
    { title: 'Monthly grants summary',          desc: 'Expected vs received grants across all sponsees.',     category: 'Financial',    lastRun: 'May 27, 2026', icon: 'download' },
    { title: 'Quarterly fiscal sponsorship report', desc: 'Per-sponsee deposits, fees, and balance changes.', category: 'Financial',    lastRun: 'Apr 30, 2026', icon: 'bank'     },
    { title: 'Year-to-date revenue',            desc: 'Total funds processed, fees collected, by month.',     category: 'Financial',    lastRun: 'May 25, 2026', icon: 'clipboard' },
    { title: 'Active sponsees',                 desc: 'Onboarded sponsees with recent activity.',             category: 'Sponsorship',  lastRun: 'May 28, 2026', icon: 'user'     },
    { title: 'Sponsorship pipeline',            desc: 'Applications in review and pending decisions.',        category: 'Sponsorship',  lastRun: 'May 26, 2026', icon: 'clock'    },
    { title: 'Member engagement',               desc: 'Logins, broadcast opens, document uploads.',           category: 'Activity',     lastRun: 'May 24, 2026', icon: 'chat'     },
    { title: 'Transaction volume',              desc: 'Deposits and transfer requests by day.',               category: 'Activity',     lastRun: 'May 27, 2026', icon: 'arrow'    },
    { title: 'State filings due',               desc: 'Per-state reporting deadlines for the next 90 days.',  category: 'Compliance',   lastRun: 'May 20, 2026', icon: 'shield'   },
    { title: 'Annual 1099-K preparation',       desc: 'Sponsees over the IRS reporting threshold.',           category: 'Compliance',   lastRun: 'Jan 31, 2026', icon: 'folder'   }
  ]

  const categories: { name: Category; tone: string; desc: string }[] = [
    { name: 'Financial',   tone: 'green', desc: 'Grants, deposits, fees, and balances.' },
    { name: 'Sponsorship', tone: 'blue',  desc: 'Sponsee onboarding, pipeline, and renewals.' },
    { name: 'Activity',    tone: 'amber', desc: 'Member behavior, broadcast engagement, transactions.' },
    { name: 'Compliance',  tone: 'red',   desc: 'State filings, IRS thresholds, audit prep.' }
  ]

  let selected = $state<Category | 'All'>('All')

  const filtered = $derived(
    selected === 'All' ? reports : reports.filter(r => r.category === selected)
  )

  function toneFor(cat: Category): string {
    return categories.find(c => c.name === cat)?.tone ?? 'green'
  }
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/admin">Admin</a> <span>›</span> <span>Reports</span>
  </nav>

  <header>
    <div>
      <h1>Reports</h1>
      <p>Run saved reports, build custom views, or export raw data.</p>
    </div>
    <div class="header-actions">
      <button class="ghost"><Icon name="download" size={16} /> Export raw data</button>
      <a class="primary" href="/preview/admin/reports/new"><Icon name="plus" size={16} /> Build report</a>
    </div>
  </header>

  <section class="categories">
    <button
      class="cat"
      class:active={selected === 'All'}
      onclick={() => (selected = 'All')}
    >
      <span class="cat-label">All</span>
      <span class="cat-count">{reports.length}</span>
    </button>
    {#each categories as c}
      <button
        class="cat cat-{c.tone}"
        class:active={selected === c.name}
        onclick={() => (selected = c.name)}
        title={c.desc}
      >
        <span class="cat-label">{c.name}</span>
        <span class="cat-count">{reports.filter(r => r.category === c.name).length}</span>
      </button>
    {/each}
  </section>

  <section class="reports-grid">
    {#each filtered as r (r.title)}
      <article class="card report-card">
        <div class="report-head">
          <div class="icon-wrap tone-{toneFor(r.category)}"><Icon name={r.icon} size={18} /></div>
          <span class="tag tag-{toneFor(r.category)}">{r.category}</span>
        </div>
        <h3>{r.title}</h3>
        <p>{r.desc}</p>
        <div class="report-foot">
          <span class="muted">Last run · {r.lastRun}</span>
          <div class="actions">
            <button class="ghost-sm"><Icon name="eye" size={14} /></button>
            <button class="primary-sm">Run</button>
          </div>
        </div>
      </article>
    {/each}
  </section>
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

  .categories { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .cat {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.55rem 0.95rem;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    font-size: 0.9rem;
    cursor: pointer;
    color: var(--cg-text);
    font-weight: 500;
  }
  .cat:hover { border-color: var(--cg-green); }
  .cat.active { border-color: var(--cg-green); color: var(--cg-green); background: rgba(30,122,58,0.05); }
  .cat-count { background: var(--cg-bg); color: var(--cg-text-muted); padding: 0.1rem 0.5rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600; }
  .cat.active .cat-count { background: rgba(30,122,58,0.12); color: var(--cg-green); }

  .reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }

  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }
  .report-card { padding: 1.25rem; display: grid; gap: 0.6rem; transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s; }
  .report-card:hover { border-color: var(--cg-green); transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.04), 0 12px 28px rgba(0,0,0,0.06); }

  .report-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
  .icon-wrap { width: 2.4rem; height: 2.4rem; border-radius: 50%; display: grid; place-items: center; }
  .tone-green { background: rgba(30,122,58,0.1); color: var(--cg-green); }
  .tone-blue  { background: rgba(45,108,189,0.1); color: #2d6cbd; }
  .tone-amber { background: rgba(214,143,30,0.12); color: #b96e0c; }
  .tone-red   { background: rgba(179,38,30,0.1); color: var(--cg-error); }

  .tag { font-size: 0.7rem; font-weight: 600; padding: 0.18rem 0.55rem; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em; }
  .tag-green { background: rgba(30,122,58,0.12); color: var(--cg-green); }
  .tag-blue  { background: rgba(45,108,189,0.12); color: #2d6cbd; }
  .tag-amber { background: rgba(214,143,30,0.14); color: #b96e0c; }
  .tag-red   { background: rgba(179,38,30,0.12); color: var(--cg-error); }

  .report-card h3 { margin: 0; font-size: 1.02rem; font-weight: 600; color: var(--cg-text); letter-spacing: -0.005em; }
  .report-card p { margin: 0; font-size: 0.88rem; color: var(--cg-text-muted); line-height: 1.45; }

  .report-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--cg-border); }
  .muted { color: var(--cg-text-muted); font-size: 0.78rem; }
  .actions { display: flex; gap: 0.4rem; }
  .ghost-sm { padding: 0.4rem; background: transparent; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); cursor: pointer; color: var(--cg-text-muted); display: grid; place-items: center; }
  .ghost-sm:hover { color: var(--cg-text); border-color: var(--cg-green); }
  .primary-sm { padding: 0.4rem 0.85rem; background: var(--cg-green); color: white; border: none; border-radius: var(--cg-radius-sm); font-size: 0.82rem; font-weight: 500; cursor: pointer; }
  .primary-sm:hover { background: var(--cg-green-hover); }
</style>
