<script lang="ts">
  import { goto } from '$app/navigation'
  import Brand from '$lib/components/Brand.svelte'

  let name = $state('')
  let password = $state('')
  let error = $state<string | null>(null)
  let submitting = $state(false)

  async function submit(e: Event) {
    e.preventDefault()
    error = null
    submitting = true
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, password })
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        error = body.message ?? `Sign in failed (${res.status})`
        return
      }
      const { token, menu } = await res.json()
      localStorage.setItem('cg_token', token)
      if (Array.isArray(menu)) localStorage.setItem('cg_menu', JSON.stringify(menu))
      await goto('/')
    } catch {
      error = 'Network error — please try again.'
    } finally {
      submitting = false
    }
  }
</script>

<main>
  <div class="card">
    <div class="brand-wrap">
      <Brand size={36} />
    </div>

    <h1>Sign in</h1>
    <p class="subtitle">Welcome back. Sign in to access your account.</p>

    <form onsubmit={submit} novalidate>
      <label>
        <span>Username</span>
        <input
          type="text"
          bind:value={name}
          autocomplete="username"
          placeholder="your-username"
          required
        />
      </label>

      <label>
        <span>Password</span>
        <input
          type="password"
          bind:value={password}
          autocomplete="current-password"
          placeholder="••••••••"
          required
        />
      </label>

      {#if error}
        <p class="error" role="alert">{error}</p>
      {/if}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  </div>
</main>

<style>
  main {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 1.5rem;
  }

  .card {
    width: 100%;
    max-width: 400px;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: var(--cg-shadow);
    padding: 2.5rem;
  }

  .brand-wrap { margin-bottom: 2rem; }

  h1 {
    margin: 0 0 0.5rem;
    font-size: 1.65rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .subtitle {
    margin: 0 0 1.75rem;
    color: var(--cg-text-muted);
    font-size: 0.95rem;
  }

  form {
    display: grid;
    gap: 1rem;
  }

  label {
    display: grid;
    gap: 0.4rem;
  }
  label span {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--cg-text);
  }

  input {
    padding: 0.7rem 0.85rem;
    font-size: 1rem;
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    background: var(--cg-surface);
    color: var(--cg-text);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  input::placeholder { color: #aab1ad; }
  input:focus {
    outline: none;
    border-color: var(--cg-green);
    box-shadow: 0 0 0 3px var(--cg-green-soft);
  }

  .error {
    margin: -0.25rem 0 0;
    padding: 0.6rem 0.75rem;
    background: rgba(179, 38, 30, 0.07);
    color: var(--cg-error);
    border-radius: var(--cg-radius-sm);
    font-size: 0.88rem;
  }

  button {
    margin-top: 0.5rem;
    padding: 0.8rem 1rem;
    background: var(--cg-green);
    color: white;
    border: none;
    border-radius: var(--cg-radius-sm);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  button:hover:not(:disabled) { background: var(--cg-green-hover); }
  button:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
