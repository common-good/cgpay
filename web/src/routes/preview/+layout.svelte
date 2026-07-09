<script lang="ts">
  import TopNav from '$lib/components/TopNav.svelte'
  import { page } from '$app/state'

  let { children } = $props()

  const isAdmin = $derived(page.url.pathname.startsWith('/preview/admin'))

  const user = $derived(
    isAdmin
      ? { name: 'William Spademan', org: 'Super Admin', initials: 'WS' }
      : { name: 'Jane Smith', org: 'EarthSeed Consulting', initials: 'JS' }
  )

  const active = $derived.by(() => {
    const path = page.url.pathname
    if (path.startsWith('/grants')) return 'Funds'
    return 'Dashboard'
  })
</script>

<TopNav {active} {user} />

<main>
  {@render children()}
</main>

<style>
  main {
    min-height: calc(100vh - 64px);
    background: var(--cg-bg);
  }
</style>
