<script lang="ts">
  const previews = [
    {
      title: 'Member Dashboard',
      href: '/preview/dashboard',
      note: 'Sponsee/member view with summary cards, quick actions, and recent activity.'
    },
    {
      title: 'Grants Dashboard',
      href: '/preview/grants',
      note: 'Admin view of expected vs received grants, with matching status (Matched / Needs Review / Unmatched).'
    },
    {
      title: 'Report Expected Grant',
      href: '/preview/grants/new',
      note: 'Single-grant form with donor autocomplete, validation, and a confirmations checklist.'
    }
  ]
</script>

<section>
  <header>
    <h1>Design previews</h1>
    <p>UI-only scaffolds with placeholder data, built from Jose's mockups + William's simplifications.</p>
  </header>

  <ul class="grid">
    {#each previews as p}
      <li>
        <a href={p.href}>
          <h2>{p.title}</h2>
          <p>{p.note}</p>
          <span class="cta">View →</span>
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  section { max-width: 960px; margin: 3rem auto; padding: 0 1.5rem; }
  header h1 { margin: 0 0 0.4rem; font-size: 1.75rem; font-weight: 600; letter-spacing: -0.01em; }
  header p { color: var(--cg-text-muted); margin: 0 0 2rem; }

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
  .grid h2 { margin: 0 0 0.5rem; font-size: 1.1rem; font-weight: 600; color: var(--cg-text); }
  .grid p { margin: 0 0 1rem; color: var(--cg-text-muted); font-size: 0.9rem; }
  .cta { color: var(--cg-green); font-weight: 500; font-size: 0.9rem; }
</style>
