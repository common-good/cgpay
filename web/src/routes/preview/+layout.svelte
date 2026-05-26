<script lang="ts">
  import TopNav from '$lib/components/TopNav.svelte'
  import { page } from '$app/state'

  let { children } = $props()

  const active = $derived.by(() => {
    const path = page.url.pathname
    if (path.startsWith('/preview/dashboard')) return 'Dashboard'
    if (path.startsWith('/preview/grants')) return 'Funds'
    return 'Dashboard'
  })
</script>

<TopNav {active} />

<main>
  {@render children()}
</main>

<style>
  main {
    min-height: calc(100vh - 64px);
    background: var(--cg-bg);
  }
</style>
