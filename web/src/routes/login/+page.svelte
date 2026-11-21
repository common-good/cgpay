<script lang="ts">
  import { goto } from '$app/navigation'
  import { env } from '$env/dynamic/public'
  import Brand from '$lib/components/Brand.svelte'
  import { onMount } from 'svelte'
  import { inApp } from '$lib/app-shell'

  let app = $state(false)
  onMount(() => app = inApp())
  let identifier = $state('')
  let password = $state('')
  let error = $state<string | null>(null)
  let submitting = $state(false)

  const phpBase = (env.PUBLIC_PHP_BASE_URL ?? '').replace(/\/$/, '')
  const signupHref = phpBase ? phpBase + '/signup' : ''
  const forgotHref = '/reset'

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
      // Identity is now derived from the SSO cookie server-side on every
      // request (see +layout.server.ts). No token to store. invalidateAll so the
      // layout load reruns with the new cookie; SvelteKit doesn't track cookies.
      await goto('/', { invalidateAll: true })
    } catch {
      error = 'Network error - please try again.'
    } finally {
      submitting = false
    }
  }
</script>

<main class="auth" class:app>
  <div class="auth-card" role="region" aria-labelledby="signin-h1">
    {#if app}<Brand size={40} />{/if}
    <div class="auth-head">
      <h1 id="signin-h1">Sign in</h1>
      <p>Welcome back. Sign in to access your account.</p>
    </div>

    <form class="stack" onsubmit={submit} novalidate>
      <div class="field">
        <label for="identifier">Account ID</label>
        <input id="identifier" data-testid="identifier" type="text" bind:value={identifier} autocomplete="username"
          autocapitalize="none" spellcheck="false" placeholder="Account code, name, email or phone" required />
      </div>

      <div class="field">
        <div class="label-row">
          <label for="password">Password</label>
          {#if forgotHref}<a class="forgot" data-testid="lnk-reset" href={forgotHref}>Reset password</a>{/if}
        </div>
        <input id="password" data-testid="password" type="password" bind:value={password} autocomplete="current-password" required />
      </div>

      {#if error}<p class="alert alert-error" role="alert">{error}</p>{/if}

      <button type="submit" class="btn btn-primary btn-block" data-testid="btn-signin" disabled={submitting}>
        {submitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>

    <div class="auth-foot">
      {#if signupHref}
        <p>New to Common Good? <a class="link" data-testid="lnk-signup" href={signupHref}>Create an account</a></p>
      {/if}
    </div>
  </div>
</main>

<style>
  .forgot { font-size: var(--fs-sm); font-weight: 500; padding: var(--sp-2) 0; margin: calc(-1 * var(--sp-2)) 0; }
  /* In the store app the top bar is hidden on this page (see +layout.svelte), so the card shows the brand and fills the screen. */
  .auth.app { background: var(--cg-surface); padding-top: max(var(--sp-6), env(safe-area-inset-top)); }
  .auth.app .auth-card { border: 0; box-shadow: none; padding: 0; }
</style>
