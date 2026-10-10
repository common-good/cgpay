<script lang="ts">
  import { page } from '$app/state'

  let { data, children } = $props()

  type NavLink = { href: string; label: string }
  const links: NavLink[] = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/members', label: 'Members' },
    { href: '/admin/sponsees', label: 'Sponsees' }
  ]

  function isActive(href: string): boolean {
    const p = page.url.pathname
    if (href === '/admin') return p === '/admin'
    return p === href || p.startsWith(href + '/')
  }
</script>

<div class="admin-wrap">
  <aside class="admin-nav" aria-label="Admin sections">
    <div class="admin-badge">Admin</div>
    <nav>
      <ul>
        {#each links as link}
          <li>
            <a href={link.href} class:active={isActive(link.href)}>{link.label}</a>
          </li>
        {/each}
      </ul>
    </nav>
    <div class="admin-user">
      Signed in as <strong>{data.user.name}</strong>
    </div>
  </aside>
  <section class="admin-main">
    {@render children()}
  </section>
</div>

<style>
  .admin-wrap {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 0;
    min-height: calc(100vh - 60px);
  }

  .admin-nav {
    background: var(--cg-surface);
    border-right: 1px solid var(--cg-border);
    padding: 1.25rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .admin-badge {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--cg-navy);
    background: rgba(9, 70, 166, 0.08);
    padding: 0.35rem 0.6rem;
    border-radius: var(--cg-radius-sm);
    align-self: flex-start;
  }
  .admin-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .admin-nav a {
    display: block;
    padding: 0.55rem 0.75rem;
    font-size: 0.92rem;
    color: var(--cg-text);
    border-radius: var(--cg-radius-sm);
    text-decoration: none;
  }
  .admin-nav a:hover { background: rgba(0, 0, 0, 0.04); text-decoration: none; }
  .admin-nav a.active {
    background: rgba(9, 70, 166, 0.08);
    color: var(--cg-navy);
    font-weight: 600;
  }
  .admin-user {
    margin-top: auto;
    font-size: 0.8rem;
    color: var(--cg-text-muted);
    padding: 0.5rem 0.75rem;
    border-top: 1px solid var(--cg-border);
  }

  .admin-main {
    padding: 1.5rem 2rem;
    max-width: 1200px;
  }

  @media (max-width: 720px) {
    .admin-wrap {
      grid-template-columns: 1fr;
    }
    .admin-nav {
      border-right: none;
      border-bottom: 1px solid var(--cg-border);
      padding: 0.75rem 1rem;
    }
    .admin-nav ul {
      flex-direction: row;
      gap: 0.5rem;
      overflow-x: auto;
    }
    .admin-user { display: none; }
  }
</style>
