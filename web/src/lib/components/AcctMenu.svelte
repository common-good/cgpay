<script module lang="ts">
  export type Item = { id: string, label: string, href?: string, onclick?: () => void }
</script>

<script lang="ts">
  import { onMount } from 'svelte'
  // The account's picture (or its initials), which opens a menu of account-related choices. Used by the live site's header and the store app's screens.
  let { name, photo = null, items }: { name: string, photo?: string | null, items: Item[] } = $props()

  let open = $state(false), broken = $state(false), ready = $state(false)
  onMount(() => ready = true) // the server-rendered button does nothing until the page is live
  const initials = $derived(name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join(''))
</script>

<svelte:window onclick={() => open = false} />

<div class="acct-menu">
  <button class="pic" data-testid="btn-acct-menu" aria-haspopup="menu" aria-expanded={open} disabled={!ready} title={name} onclick={e => { e.stopPropagation(); open = !open }}>
    {#if photo && !broken}<img src={photo} alt={name} onerror={() => broken = true} />{:else}<span>{initials}</span>{/if}
  </button>
  {#if open}
    <ul role="menu" data-testid="acct-menu">
      <li class="who" data-testid="acct-menu-name">{name}</li>
      {#each items as it}
        <li role="none">
          {#if it.href}<a role="menuitem" data-testid="menu-{it.id}" href={it.href}>{it.label}</a>
          {:else}<button role="menuitem" data-testid="menu-{it.id}" onclick={() => { open = false; it.onclick?.() }}>{it.label}</button>{/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .acct-menu { position: relative; }
  .pic { width: 40px; height: 40px; padding: 0; border-radius: 50%; overflow: hidden; border: 2px solid #fff; background: #1e7a3a; color: #fff; font-weight: 600; cursor: pointer; }
  .pic img { width: 100%; height: 100%; object-fit: cover; display: block; }
  ul { position: absolute; right: 0; top: 46px; z-index: 10; min-width: 200px; margin: 0; padding: 6px 0; list-style: none; background: #fff; border-radius: 8px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); }
  li > a, li > button { display: block; width: 100%; padding: 10px 16px; text-align: left; background: none; border: 0; border-radius: 0; color: #1a1f1c; font: inherit; text-decoration: none; cursor: pointer; }
  li > a:hover, li > button:hover { background: #f0f3f0; }
  .who { padding: 8px 16px; font-size: 0.85rem; color: #5a615e; border-bottom: 1px solid #e4e8e4; }
</style>
