<script lang="ts">
  import '$lib/styles/app.css'
  import { goto, invalidateAll, onNavigate } from '$app/navigation'
  import { page } from '$app/state'
  import { env } from '$env/dynamic/public'
  import Brand from '$lib/components/Brand.svelte'
  import { appVersion } from '$lib/version'
  import favicon from '$lib/assets/favicon.svg'
  import { onMount } from 'svelte'
  import { inApp, appLink, device, type Device } from '$lib/app-shell'

  let { data, children } = $props()
  let app = $state(false)
  let dev = $state<Device | null>(null)
  onMount(() => app = inApp())
  $effect(() => { if (app && data.user) device(data.user.name).then(d => dev = d) })

  // Hide the app header on preview routes (they use their own layout + white-bg TopNav).
  const isPreview = $derived(page.url.pathname.startsWith('/preview'))
  const isLogin   = $derived(page.url.pathname.startsWith('/login'))
  const showHeader = $derived(!isPreview && !(app && isLogin)) // the login card carries the brand itself

  const phpBase = env.PUBLIC_PHP_BASE_URL ?? ''
  const PHP_PATH: Record<string, string> = {
    Dashboard: '/dashboard', History: '/history', Community: '/community',
    Settings: '/settings', Company: '/co', Admin: '/sadmin'
  }
  function menuHref(label: string): string {
    if (!phpBase) return ''
    return phpBase.replace(/\/$/, '') + (PHP_PATH[label] ?? `/${label.toLowerCase()}`)
  }

  const activeLabel = $derived.by(() => {
    const p = page.url.pathname
    if (p === '/') return 'Dashboard'
    if (p.startsWith('/grants')) return 'Grants'
    return ''
  })

  // Cross-fade between pages where the browser supports it; app.css shortens it to nothing under reduced motion.
  onNavigate(nav => {
    if (!document.startViewTransition || nav.from?.url.pathname === nav.to?.url.pathname) return
    return new Promise(done => document.startViewTransition(async () => { done(); await nav.complete }))
  })

  let links = $state<HTMLElement>()
  $effect(() => { activeLabel; links?.querySelector('.active')?.scrollIntoView({ block: 'nearest', inline: 'center' }) })

  async function signOut() {
    try {
      await fetch('/api/logout', { method: 'POST' })
    } catch (e) {
      // Network failure clearing the server-side cookie. Still navigate to /login so
      // the UI reflects the user's intent; the stale cookie will expire, or the next
      // successful logout call will clear it. Logged so a repro shows up in devtools.
      console.warn('[signOut] /api/logout failed; proceeding to /login anyway:', e)
    }
    await invalidateAll()
    goto('/login')
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
{#if showHeader}
  <nav class="topnav" data-testid="topnav">
    <Brand size={32} />
    {#if data.user && !isLogin}
      <ul class="nav-links" bind:this={links}>
        {#each data.user.menu as label}
          {#if menuHref(label)}
            <li><a class:active={label === activeLabel} href={label === 'Dashboard' ? '/' : menuHref(label)}>{label}</a></li>
          {:else}
            <li><button type="button" class="nav-disabled" title="Member site link not configured">{label}</button></li>
          {/if}
        {/each}
        {#if app}
          <li><a data-testid="nav-app" href={appLink(dev, {}, env.PUBLIC_APP_URL) || '#'} aria-disabled={!dev || undefined}>Scan</a></li>
        {/if}
        {#if data.user.sponsored}
          <li><a class:active={activeLabel === 'Grants'} href="/grants">Grants</a></li>
        {/if}
      </ul>
      <div class="account">
        <span class="hi">Hi, {data.user.name}</span>
        <button class="signout" onclick={signOut}>Sign out</button>
      </div>
    {:else}
      <div class="spacer"></div>
    {/if}
  </nav>
{/if}

<div class="shell-main">{@render children()}</div>

<footer class="app-version" title="Currently deployed build">
  <span class="ver-branch">{appVersion.branch}</span>
  <span class="ver-sep">·</span>
  <span class="ver-sha">{appVersion.sha}</span>
  {#if appVersion.builtAt}
    <span class="ver-sep">·</span>
    <span class="ver-time">{new Date(appVersion.builtAt).toLocaleString()}</span>
  {/if}
</footer>
</div>

<style>
  .shell { min-height: 100dvh; display: flex; flex-direction: column; }
  .shell-main { flex: 1; display: flex; flex-direction: column; }

  .topnav {
    view-transition-name: topnav;
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-areas: "brand links account";
    align-items: center;
    column-gap: var(--sp-6);
    padding: 0 var(--gutter);
    min-height: 60px;
    background: var(--cg-navy);
    color: var(--cg-on-navy);
  }
  .topnav > :global(.brand) { grid-area: brand; }
  .nav-links { grid-area: links; list-style: none; padding: 0; margin: 0; display: flex; gap: var(--sp-1); min-width: 0; }
  .nav-links a, .nav-disabled {
    display: flex; align-items: center; min-height: var(--tap); padding: 0 var(--sp-3);
    color: var(--cg-on-navy-muted); font-size: var(--fs-sm); font-weight: 500; white-space: nowrap;
    border-radius: var(--r-sm); text-decoration: none; position: relative;
    transition: color var(--dur-fast), background-color var(--dur-fast);
  }
  .nav-links a.active { color: var(--cg-on-navy); }
  .nav-links a.active::after { content: ''; position: absolute; left: var(--sp-3); right: var(--sp-3); bottom: 4px; height: 2px; border-radius: 2px; background: currentColor; }
  @media (hover: hover) { .nav-links a:hover { color: var(--cg-on-navy); background: var(--cg-navy-soft); text-decoration: none; } }
  .nav-disabled { background: none; border: 0; opacity: 0.55; cursor: not-allowed; }
  .account { grid-area: account; display: flex; align-items: center; gap: var(--sp-3); }
  .hi { font-size: var(--fs-sm); }
  .signout {
    min-height: 36px; padding: 0 var(--sp-3); background: transparent; color: var(--cg-on-navy);
    border: 1px solid var(--cg-on-navy-muted); border-radius: var(--r-sm); font-size: var(--fs-sm); cursor: pointer;
  }
  @media (hover: hover) { .signout:hover { background: var(--cg-navy-soft); } }
  .spacer { grid-area: links; }

  /* Phones: brand and account on one row, the menu as one row below that scrolls sideways instead of wrapping. */
  @media (max-width: 799px) {
    .topnav { grid-template-columns: 1fr auto; grid-template-areas: "brand account" "links links"; row-gap: var(--sp-1); padding-top: var(--sp-2); }
    .nav-links { overflow-x: auto; scrollbar-width: none; margin: 0 calc(-1 * var(--gutter)); padding: 0 calc(var(--gutter) - var(--sp-3)); scroll-padding: 0 var(--gutter); }
    .nav-links::-webkit-scrollbar { display: none; }
    .hi { display: none; }
  }

  .app-version {
    padding: var(--sp-3) var(--gutter);
    text-align: center;
    font: var(--fs-xs)/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: var(--cg-text-subtle);
  }
  .app-version .ver-sep { margin: 0 0.35rem; opacity: 0.5; }
</style>
