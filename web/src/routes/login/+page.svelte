<script lang="ts">
  import { goto } from '$app/navigation'
  import { env } from '$env/dynamic/public'
  import Brand from '$lib/components/Brand.svelte'

  let identifier = $state('')
  let password = $state('')
  let error = $state<string | null>(null)
  let submitting = $state(false)

  const phpBase = env.PUBLIC_PHP_BASE_URL ?? ''
  const helpHref = phpBase ? phpBase.replace(/\/$/, '') + '/help' : 'mailto:support@commongood.earth'

  async function submit(e: Event) {
    e.preventDefault()
    error = null
    submitting = true
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier, password })
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
      error = 'Network error - please try again.'
    } finally {
      submitting = false
    }
  }
</script>

<main class="page">
  <div class="card" role="region" aria-labelledby="signin-h1">
    <div class="card-top">
      <Brand size={40} />
      <p class="tagline">A fiscally sponsored economy for the common good</p>
    </div>

    <div class="card-body">
      <h1 id="signin-h1">Sign in</h1>
      <p class="subtitle">Welcome back. Sign in to access your account.</p>

      <form onsubmit={submit} novalidate>
        <div class="field">
          <label for="identifier">Account ID</label>
          <input
            id="identifier"
            type="text"
            bind:value={identifier}
            autocomplete="username"
            placeholder="account code, name, email, or phone"
            required
          />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            autocomplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>

        {#if error}
          <p class="err" role="alert">{error}</p>
        {/if}

        <button type="submit" class="primary" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div class="foot">
        <a class="help-link" href={helpHref}>Need help signing in?</a>
      </div>
    </div>
  </div>
</main>

<style>
  .page {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 2rem 1.25rem;
    background:
      radial-gradient(ellipse at top, #e6f0e6 0%, transparent 55%),
      linear-gradient(180deg, #eaf1ea 0%, var(--cg-bg) 45%);
  }

  .card {
    width: 100%;
    max-width: 420px;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: var(--cg-shadow);
    overflow: hidden;
  }

  .card-top {
    padding: 1.75rem 2rem 1.25rem;
    background: var(--cg-navy);
    color: var(--cg-on-navy);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
  }
  .tagline {
    margin: 0;
    color: var(--cg-on-navy-muted);
    font-size: 0.88rem;
    font-weight: 400;
    letter-spacing: 0.01em;
  }

  .card-body {
    padding: 1.75rem 2rem 1.5rem;
  }

  h1 {
    margin: 0 0 0.35rem;
    font-size: 1.55rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--cg-text);
  }
  .subtitle {
    margin: 0 0 1.5rem;
    color: var(--cg-text-muted);
    font-size: 0.92rem;
  }

  form { display: grid; gap: 1rem; }
  .field { display: grid; gap: 0.35rem; }
  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--cg-text);
  }

  input {
    padding: 0.65rem 0.8rem;
    font-size: 0.95rem;
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

  .err {
    margin: -0.25rem 0 0;
    padding: 0.65rem 0.8rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    border-radius: var(--cg-radius-sm);
    font-size: 0.88rem;
  }

  .primary {
    margin-top: 0.4rem;
    padding: 0.75rem 1rem;
    background: var(--cg-green);
    color: white;
    border: none;
    border-radius: var(--cg-radius-sm);
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .primary:hover:not(:disabled) { background: var(--cg-green-hover); }
  .primary:disabled { opacity: 0.6; cursor: not-allowed; }

  .foot {
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--cg-border);
    text-align: center;
  }
  .help-link {
    color: var(--cg-text-muted);
    font-size: 0.85rem;
    text-decoration: none;
  }
  .help-link:hover { color: var(--cg-green); text-decoration: underline; }
</style>
