<script lang="ts">
  const sections = [
    {
      role: 'Ordinary user — two variants side-by-side',
      tag: 'For Jose to compare and pick a direction',
      previews: [
        {
          title: 'Member Dashboard — rich (Jose\'s mockup)',
          href: '/preview/dashboard',
          note: 'Summary cards (Available Funds / Pending Deposits / Pending Requests / Unread Messages), Quick Actions, and Recent Activity.'
        },
        {
          title: 'Member Dashboard — simple (William\'s 4-function spec)',
          href: '/preview/dashboard-simple',
          note: 'Lean payment-first view: balance + Pay / Receive / Transfer + Recent transactions. Everything else moves to secondary menus.'
        }
      ]
    },
    {
      role: 'Sponsee flows',
      tag: 'For sponsored organizations like EarthSeed Consulting',
      previews: [
        {
          title: 'Report Expected Grant',
          href: '/grants/new',
          note: 'Single-grant form with donor autocomplete, required-field validation, and confirmations checklist.'
        }
      ]
    },
    {
      role: 'Super Admin',
      tag: 'For Common Good staff (William, etc.)',
      previews: [
        {
          title: 'Admin Dashboard',
          href: '/preview/admin',
          note: 'Overview tiles (Users / Organizations / Pending Deposits / Alerts), large workflow action cards, and an Advanced Tools disclosure.'
        },
        {
          title: 'Grants Dashboard',
          href: '/grants',
          note: 'Admin view of expected vs received grants with matching status (Matched / Needs Review / Unmatched).'
        }
      ]
    }
  ]
</script>

<section>
  <header>
    <h1>Design previews</h1>
    <p>UI-only scaffolds with placeholder data, built from Jose's mockups + William's simplifications.</p>
  </header>

  {#each sections as s}
    <div class="role-section">
      <div class="role-header">
        <h2>{s.role}</h2>
        <span class="tag">{s.tag}</span>
      </div>
      <ul class="grid">
        {#each s.previews as p}
          <li>
            <a href={p.href}>
              <h3>{p.title}</h3>
              <p>{p.note}</p>
              <span class="cta">View →</span>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</section>

<style>
  section { max-width: 960px; margin: 3rem auto; padding: 0 1.5rem; }
  header h1 { margin: 0 0 0.4rem; font-size: 1.75rem; font-weight: 600; letter-spacing: -0.01em; }
  header > p { color: var(--cg-text-muted); margin: 0 0 2.5rem; }

  .role-section { margin-bottom: 2.5rem; }
  .role-header { display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1rem; }
  .role-header h2 { margin: 0; font-size: 1.15rem; font-weight: 600; color: var(--cg-text); }
  .tag {
    padding: 0.15rem 0.6rem;
    background: rgba(30,122,58,0.1);
    color: var(--cg-green);
    font-size: 0.72rem;
    font-weight: 600;
    border-radius: 999px;
  }

  .grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 1.25rem;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
  .grid a {
    display: block;
    padding: 1.5rem;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s, transform 0.15s;
  }
  .grid a:hover {
    border-color: var(--cg-green);
    transform: translateY(-2px);
  }
  .grid h3 { margin: 0 0 0.5rem; font-size: 1.05rem; font-weight: 600; color: var(--cg-text); }
  .grid p { margin: 0 0 1rem; color: var(--cg-text-muted); font-size: 0.9rem; line-height: 1.45; }
  .cta { color: var(--cg-green); font-weight: 500; font-size: 0.9rem; }
</style>
