<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { env } from '$env/dynamic/public'
  import Brand from '$lib/components/Brand.svelte'
  import favicon from '$lib/assets/favicon.svg'

  let { children } = $props()

  type UserInfo = { name?: string } | null
  let userInfo = $state<UserInfo>(null)
  let menu = $state<string[]>(['Dashboard', 'History', 'Community', 'Settings'])
  let mounted = $state(false)

  // Hide the app header on preview routes (they use their own layout + white-bg TopNav).
  const isPreview = $derived(page.url.pathname.startsWith('/preview'))
  const isLogin   = $derived(page.url.pathname.startsWith('/login'))
  const showHeader = $derived(!isPreview)

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

  onMount(async () => {
    mounted = true
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('cg_token') : null
    if (!token) return

    const storedMenu = localStorage.getItem('cg_menu')
    if (storedMenu) {
      try {
        const parsed = JSON.parse(storedMenu)
        if (Array.isArray(parsed) && parsed.every(s => typeof s === 'string')) menu = parsed
      } catch { /* ignore */ }
    }

    try {
      const res = await fetch('/api/me/info?limit=1', {
        headers: { authorization: `Bearer ${token}` }
      })
      if (res.ok) userInfo = await res.json()
    } catch { /* header just shows Brand if fetch fails */ }
  })

  function signOut() {
    localStorage.removeItem('cg_token')
    localStorage.removeItem('cg_menu')
    userInfo = null
    goto('/login')
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if showHeader}
  <nav class="topnav">
    <Brand size={32} />
    {#if userInfo && !isLogin}
      <ul class="nav-links">
        {#each menu as label}
          {#if menuHref(label)}
            <li><a class:active={label === activeLabel} href={label === 'Dashboard' ? '/' : menuHref(label)}>{label}</a></li>
          {:else}
            <li><button type="button" class="nav-disabled" title="Member site link not configured">{label}</button></li>
          {/if}
        {/each}
        <li><a class:active={activeLabel === 'Grants'} href="/grants">Grants</a></li>
      </ul>
      <div class="account">
        <span class="hi">Hi, {userInfo.name ?? ''}</span>
        <button class="ghost" onclick={signOut}>Sign out</button>
      </div>
    {:else}
      <div class="spacer"></div>
    {/if}
  </nav>
{/if}

{@render children()}

<style>
  :global(:root) {
    --cg-green: #1e7a3a;
    --cg-green-hover: #155a2b;
    --cg-green-soft: rgba(30, 122, 58, 0.08);
    --cg-navy: #0946A6;            /* matches the commongood.earth promo-site header */
    --cg-navy-soft: rgba(255, 255, 255, 0.1);
    --cg-bg: #f5f7f4;
    --cg-surface: #ffffff;
    --cg-border: #e4e8e4;
    --cg-text: #1a1f1c;
    --cg-text-muted: #5a615e;
    --cg-on-navy: #ffffff;
    --cg-on-navy-muted: rgba(255, 255, 255, 0.7);
    --cg-error: #b3261e;
    --cg-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06);
    --cg-radius: 12px;
    --cg-radius-sm: 8px;
  }

  :global(*) { box-sizing: border-box; }
  :global(html, body) {
    margin: 0;
    padding: 0;
    background: var(--cg-bg);
    color: var(--cg-text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  :global(button) { font-family: inherit; }
  :global(input) { font-family: inherit; }
  :global(a) { color: var(--cg-green); text-decoration: none; }
  :global(a:hover) { text-decoration: underline; }

  .topnav {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 0.85rem 1.75rem;
    background: var(--cg-navy);
    color: var(--cg-on-navy);
    border-bottom: none;
  }
  .nav-links {
    list-style: none; padding: 0; margin: 0;
    display: flex; gap: 1.5rem; flex: 1;
  }
  .nav-links a {
    color: var(--cg-on-navy-muted);
    font-size: 0.92rem;
    font-weight: 500;
    padding: 0.4rem 0.1rem;
    border-bottom: 2px solid transparent;
    text-decoration: none;
  }
  .nav-links a:hover { color: var(--cg-on-navy); text-decoration: none; }
  .nav-links a.active { color: var(--cg-on-navy); border-bottom-color: var(--cg-green); }
  .nav-disabled {
    background: transparent;
    border: none;
    padding: 0.4rem 0.1rem;
    color: var(--cg-on-navy-muted);
    font-size: 0.92rem;
    font-weight: 500;
    opacity: 0.55;
    cursor: not-allowed;
    font-family: inherit;
  }
  .account {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .hi { color: var(--cg-on-navy); font-size: 0.9rem; }
  .ghost {
    background: transparent;
    color: var(--cg-on-navy);
    border: 1px solid var(--cg-on-navy-muted);
    border-radius: var(--cg-radius-sm);
    padding: 0.35rem 0.85rem;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .ghost:hover { background: var(--cg-navy-soft); }
  .spacer { flex: 1; }
</style>
