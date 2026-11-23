<script lang="ts">
  import '$lib/styles/app.css'
  import { afterNavigate, goto, invalidateAll, onNavigate } from '$app/navigation'
  import { page } from '$app/state'
  import { env } from '$env/dynamic/public'
  import Brand from '$lib/components/Brand.svelte'
  import Icon from '$lib/components/Icon.svelte'
  import { phpUrl } from '$lib/utils'
  import { fade } from 'svelte/transition'
  import { ms, lockScroll } from '$lib/motion'
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

  // Phones: the menu folds behind a button and opens as a panel over the page.
  let menuOpen = $state(false)
  afterNavigate(() => menuOpen = false)
  $effect(() => lockScroll(menuOpen))
  let noPhoto = $state(false)

  const built = $derived.by(() => {
    if (!appVersion.builtAt) return null
    const d = new Date(appVersion.builtAt), h = d.getHours()
    return { md: `${d.getMonth() + 1}/${d.getDate()}/`, yr: String(d.getFullYear()), hm: `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}` }
  })

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

<svelte:window onkeydown={e => { if (e.key === 'Escape') menuOpen = false }} />

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
{#if showHeader}
  <nav class="topnav" class:open={menuOpen} data-testid="topnav">
    <Brand size={32} />
    {#if data.user && !isLogin}
      <div class="menu" id="main-menu">
        <ul class="nav-links">
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
      </div>
      <button type="button" class="menu-btn" aria-label="Menu" aria-controls="main-menu" aria-expanded={menuOpen} onclick={() => menuOpen = !menuOpen}>
        <Icon name={menuOpen ? 'x' : 'menu'} size={24} />
      </button>
      <a class="avatar" href={phpUrl('settings') || '#'} aria-label="Profile and settings">
        {#if noPhoto}{data.user.name.split(' ').map(w => w[0]).slice(0, 2).join('')}{:else}<img src={phpUrl('account-photo')} alt="" onerror={() => noPhoto = true} />{/if}
      </a>
    {:else}
      <div class="spacer"></div>
    {/if}
  </nav>
  {#if menuOpen}<button type="button" class="menu-backdrop" aria-label="Close menu" onclick={() => menuOpen = false} transition:fade={{ duration: ms(200) }}></button>{/if}
{/if}

<div class="shell-main">{@render children()}</div>

<footer class="app-version" title="Currently deployed build">
  <span>{appVersion.branch}</span>
  <span>{appVersion.sha}</span>
  {#if built}<span>{built.md}<span class="cc">{built.yr.slice(0, 2)}</span>{built.yr.slice(2)} {built.hm}</span>{/if}
</footer>
</div>

<style>
  .shell { min-height: 100dvh; display: flex; flex-direction: column; }
  .shell-main { flex: 1; display: flex; flex-direction: column; }

  .topnav {
    view-transition-name: topnav;
    position: relative; z-index: 50;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: var(--sp-6);
    padding: 0 var(--gutter);
    min-height: 60px;
    background: var(--cg-navy);
    color: var(--cg-on-navy);
  }
  .menu { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-6); min-width: 0; }
  .nav-links { list-style: none; padding: 0; margin: 0; display: flex; gap: var(--sp-1); min-width: 0; }
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
  .account { display: flex; align-items: center; gap: var(--sp-3); }
  .hi { font-size: var(--fs-sm); }
  .signout {
    min-height: 36px; padding: 0 var(--sp-3); background: transparent; color: var(--cg-on-navy);
    border: 1px solid var(--cg-on-navy-muted); border-radius: var(--r-sm); font-size: var(--fs-sm); cursor: pointer;
  }
  @media (hover: hover) { .signout:hover { background: var(--cg-navy-soft); } }
  .menu-btn, .avatar, .menu-backdrop { display: none; }

  /* Phones: brand on the left; the menu button and the profile picture on the right; the menu opens as a panel under the bar. */
  @media (max-width: 799px) {
    .topnav { grid-template-columns: 1fr auto auto; column-gap: var(--sp-2); padding-right: var(--sp-3); }
    .menu-btn {
      display: grid; place-items: center; width: var(--tap); height: var(--tap); border: 0; border-radius: var(--r-sm);
      background: none; color: var(--cg-on-navy); cursor: pointer;
    }
    .open .menu-btn { background: var(--cg-navy-soft); }
    .avatar {
      display: grid; place-items: center; width: 36px; height: 36px; margin: 4px; border-radius: 50%; overflow: hidden;
      background: var(--cg-navy-soft); color: var(--cg-on-navy); font-size: var(--fs-xs); font-weight: 600; text-decoration: none;
      box-shadow: 0 0 0 2px var(--cg-on-navy-muted);
    }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .menu {
      display: none; position: absolute; top: 100%; left: 0; right: 0;
      flex-direction: column; align-items: stretch; gap: 0;
      max-height: calc(100dvh - 60px); overflow-y: auto;
      padding: var(--sp-2) 0 var(--sp-3); background: var(--cg-surface); color: var(--cg-text);
      border-radius: 0 0 var(--r-lg) var(--r-lg); box-shadow: var(--shadow-2);
      animation: cg-drop var(--dur) var(--ease-out);
    }
    .open .menu { display: flex; }
    .nav-links { flex-direction: column; gap: 0; }
    .nav-links a, .nav-disabled { min-height: 52px; padding: 0 var(--gutter); color: var(--cg-text); font-size: var(--fs-base); border-radius: 0; }
    .nav-links a.active { color: var(--cg-green); font-weight: 600; }
    .nav-links a.active::after { left: 0; right: auto; top: 12px; bottom: 12px; width: 3px; height: auto; }
    .account { justify-content: space-between; padding: var(--sp-3) var(--gutter) 0; margin-top: var(--sp-2); border-top: 1px solid var(--cg-border); }
    .hi { color: var(--cg-text-muted); }
    .signout { color: var(--cg-text); border-color: var(--cg-border-strong); min-height: var(--tap); }
    .menu-backdrop { display: block; position: fixed; inset: 0; z-index: 40; border: 0; padding: 0; background: rgba(16, 24, 20, 0.45); cursor: pointer; }
  }
  @keyframes cg-drop { from { opacity: 0; transform: translateY(-8px); } }

  .app-version {
    display: flex; gap: 0.6em; overflow: hidden; white-space: nowrap;
    justify-content: center; padding: var(--sp-3) var(--gutter);
    font: var(--fs-xs)/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: var(--cg-text-subtle);
  }
  .app-version > span { flex: none; }
  @media (max-width: 420px) { .app-version { justify-content: flex-start; } }
  @media (max-width: 359px) { .cc { display: none; } }
</style>
