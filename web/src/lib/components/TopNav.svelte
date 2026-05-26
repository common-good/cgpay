<script lang="ts">
  import Icon from './Icon.svelte'
  import { page } from '$app/state'

  type Props = { active?: string }
  let { active = 'Dashboard' }: Props = $props()

  const items = ['Dashboard', 'Funds', 'Activity', 'Documents', 'Messages']
  const pageActive = $derived(active ?? items[0])
</script>

<nav>
  <a class="brand" href="/preview">
    <span class="brand-mark" aria-hidden="true">G</span>
    <span class="brand-name">Common Good</span>
  </a>

  <ul class="links">
    {#each items as item}
      <li class:active={pageActive === item}>
        <a href={item === 'Dashboard' ? '/preview/dashboard' : '/preview'}>{item}</a>
      </li>
    {/each}
  </ul>

  <div class="right">
    <button class="bell" aria-label="Notifications">
      <Icon name="bell" size={20} />
      <span class="badge">2</span>
    </button>
    <div class="profile">
      <div class="avatar" aria-hidden="true">JS</div>
      <div class="who">
        <span class="name">Jane Smith</span>
        <span class="org">EarthSeed Consulting</span>
      </div>
    </div>
  </div>
</nav>

<style>
  nav {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 2rem;
    padding: 0.85rem 1.75rem;
    background: var(--cg-surface);
    border-bottom: 1px solid var(--cg-border);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    text-decoration: none;
  }
  .brand-mark {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    background: var(--cg-green);
    color: white;
    border-radius: 50%;
    font-weight: 700;
  }
  .brand-name {
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 0.85rem;
    color: var(--cg-green);
  }
  .links {
    display: flex;
    gap: 2rem;
    list-style: none;
    margin: 0;
    padding: 0;
    justify-content: center;
  }
  .links li a {
    color: var(--cg-text-muted);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.95rem;
    padding: 1.3rem 0;
    display: block;
  }
  .links li.active a {
    color: var(--cg-green);
    border-bottom: 2px solid var(--cg-green);
  }
  .right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .bell {
    position: relative;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--cg-text-muted);
    padding: 0.4rem;
  }
  .badge {
    position: absolute;
    top: 0;
    right: 0;
    background: var(--cg-error);
    color: white;
    font-size: 0.65rem;
    font-weight: 600;
    min-width: 1rem;
    height: 1rem;
    border-radius: 999px;
    display: grid;
    place-items: center;
    padding: 0 0.3rem;
  }
  .profile {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .avatar {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    background: linear-gradient(135deg, #b8d4be 0%, #6fa67e 100%);
    color: white;
    display: grid;
    place-items: center;
    font-weight: 600;
    font-size: 0.85rem;
  }
  .who {
    display: grid;
    line-height: 1.2;
  }
  .name { font-weight: 600; font-size: 0.9rem; color: var(--cg-text); }
  .org { font-size: 0.75rem; color: var(--cg-text-muted); }
</style>
