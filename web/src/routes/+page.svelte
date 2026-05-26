<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'

  let loading = $state(true)
  let name = $state('')
  let balance = $state<number | null>(null)
  let error = $state<string | null>(null)

  onMount(async () => {
    const token = localStorage.getItem('cg_token')
    if (!token) {
      await goto('/login')
      return
    }
    try {
      const res = await fetch('/api/me/balance', {
        headers: { authorization: `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('cg_token')
        await goto('/login')
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        error = body.message ?? `failed to load balance (${res.status})`
        return
      }
      const data = await res.json()
      name = data.name
      balance = data.balance
    } finally {
      loading = false
    }
  })

  function signOut() {
    localStorage.removeItem('cg_token')
    goto('/login')
  }

  function fmt(n: number) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
</script>

<main>
  {#if loading}
    <p>Loading…</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <header>
      <span>Hi, {name}</span>
      <button onclick={signOut}>Sign out</button>
    </header>
    <section class="balance">
      <span class="label">Balance</span>
      <span class="amount">${fmt(balance ?? 0)}</span>
    </section>
  {/if}
</main>

<style>
  main { max-width: 480px; margin: 4rem auto; font-family: system-ui, sans-serif; padding: 0 1rem; }
  header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  button { padding: 0.4rem 0.8rem; cursor: pointer; }
  .balance { display: grid; gap: 0.5rem; padding: 2rem; border: 1px solid #ddd; border-radius: 0.5rem; }
  .label { font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
  .amount { font-size: 2.5rem; font-weight: 500; }
  .error { color: #b00020; }
</style>
