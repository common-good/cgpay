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
        error = body.message ?? `Failed to load balance (${res.status})`
        return
      }
      const data = await res.json()
      name = data.name
      balance = data.balance
    } catch {
      error = 'Network error — please try again.'
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

<div class="page">
  <nav>
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">G</span>
      <span class="brand-name">Common Good</span>
    </div>
    {#if !loading && !error}
      <div class="account">
        <span class="hi">Hi, {name}</span>
        <button class="ghost" onclick={signOut}>Sign out</button>
      </div>
    {/if}
  </nav>

  <main>
    {#if loading}
      <p class="state">Loading…</p>
    {:else if error}
      <div class="error-card" role="alert">
        <strong>Something went wrong</strong>
        <span>{error}</span>
      </div>
    {:else}
      <section class="balance-card" aria-labelledby="balance-label">
        <span id="balance-label" class="label">Available balance</span>
        <span class="amount">${fmt(balance ?? 0)}</span>
      </section>
    {/if}
  </main>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: var(--cg-surface);
    border-bottom: 1px solid var(--cg-border);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
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
    font-size: 1rem;
    letter-spacing: -0.02em;
  }
  .brand-name {
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.85rem;
    color: var(--cg-text-muted);
  }

  .account {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .hi {
    color: var(--cg-text);
    font-size: 0.95rem;
  }

  .ghost {
    padding: 0.5rem 0.9rem;
    background: transparent;
    color: var(--cg-text);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .ghost:hover {
    background: var(--cg-green-soft);
    border-color: var(--cg-green);
  }

  main {
    flex: 1;
    display: grid;
    place-items: center;
    padding: 2rem 1.5rem;
  }

  .state {
    color: var(--cg-text-muted);
  }

  .balance-card {
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: var(--cg-shadow);
    padding: 2.5rem 3rem;
    display: grid;
    gap: 0.75rem;
    min-width: min(360px, 100%);
    text-align: center;
  }
  .label {
    font-size: 0.8rem;
    color: var(--cg-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }
  .amount {
    font-size: 2.75rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--cg-text);
  }

  .error-card {
    max-width: 400px;
    display: grid;
    gap: 0.4rem;
    padding: 1.25rem 1.5rem;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-left: 3px solid var(--cg-error);
    border-radius: var(--cg-radius-sm);
    color: var(--cg-text);
  }
  .error-card strong {
    color: var(--cg-error);
  }
  .error-card span {
    color: var(--cg-text-muted);
    font-size: 0.9rem;
  }
</style>
