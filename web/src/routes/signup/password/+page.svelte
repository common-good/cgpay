<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import Brand from '$lib/components/Brand.svelte'
  import { validatePassword, validatePasswordConfirm } from '$lib/signup-validation'
  import { readSignupSession, clearSignupSession } from '$lib/signup-session'

  let password = $state('')
  let confirm = $state('')
  let passwordError = $state<string | null>(null)
  let confirmError = $state<string | null>(null)
  let submitError = $state<string | null>(null)
  let submitting = $state(false)

  onMount(() => {
    const session = readSignupSession()
    if (!session || !session.code) {
      // No code captured yet - send them to the verify page first.
      goto('/signup/verify')
    }
  })

  function onPasswordBlur() {
    passwordError = validatePassword(password)
    // Re-check confirm against the new password so a stale "doesn't match" clears.
    if (confirm) confirmError = validatePasswordConfirm(password, confirm)
  }

  function onConfirmBlur() {
    confirmError = validatePasswordConfirm(password, confirm)
  }

  async function submit(e: Event) {
    e.preventDefault()
    submitError = null
    passwordError = validatePassword(password)
    confirmError = validatePasswordConfirm(password, confirm)
    if (passwordError || confirmError) return

    const session = readSignupSession()
    if (!session || !session.code) {
      await goto('/signup/verify')
      return
    }

    submitting = true
    try {
      const res = await fetch('/api/signup-verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uid: session.uid, code: session.code, newPassword: password })
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body?.errors?.code) {
          // Code is wrong or expired - send them back to the verify page with context.
          submitError = body.errors.code + ' Please re-enter it.'
          setTimeout(() => goto('/signup/verify'), 1500)
          return
        }
        if (body?.errors?.newPassword) {
          passwordError = body.errors.newPassword
          return
        }
        submitError = body?.message ?? `Could not finish setting up your account (${res.status}). Try again.`
        return
      }
      // SSO cookie is set by the server endpoint; identity will hydrate on the next request.
      clearSignupSession()
      await goto('/', { invalidateAll: true })
    } catch {
      submitError = 'Network error - please try again.'
    } finally {
      submitting = false
    }
  }
</script>

<svelte:head><title>Set your password - Common Good</title></svelte:head>

<main class="page">
  <div class="card" role="region" aria-labelledby="pw-h1">
    <div class="card-top">
      <Brand size={40} />
      <p class="tagline">Last step - choose a password</p>
    </div>

    <div class="card-body">
      <h1 id="pw-h1">Set your password</h1>
      <p class="subtitle">You'll use this every time you sign in.</p>

      <form onsubmit={submit} novalidate>
        <div class="field" class:has-err={passwordError}>
          <label for="password">Password</label>
          <input
            id="password"
            data-testid="password"
            type="password"
            autocomplete="new-password"
            bind:value={password}
            onblur={onPasswordBlur}
            placeholder="at least 8 characters"
            aria-invalid={!!passwordError}
          />
          {#if passwordError}<span class="field-err">{passwordError}</span>{/if}
        </div>

        <div class="field" class:has-err={confirmError}>
          <label for="confirm">Confirm password</label>
          <input
            id="confirm"
            data-testid="confirm"
            type="password"
            autocomplete="new-password"
            bind:value={confirm}
            onblur={onConfirmBlur}
            placeholder="type it again"
            aria-invalid={!!confirmError}
          />
          {#if confirmError}<span class="field-err">{confirmError}</span>{/if}
        </div>

        {#if submitError}
          <p class="err" role="alert">{submitError}</p>
        {/if}

        <button type="submit" class="primary" data-testid="btn-set-password" disabled={submitting}>
          {submitting ? 'Finishing up…' : 'Finish signing up'}
        </button>
      </form>
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
  }
  .card-body { padding: 1.75rem 2rem 1.5rem; }
  h1 {
    margin: 0 0 0.35rem;
    font-size: 1.55rem;
    font-weight: 600;
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
  .has-err input { border-color: #dc2626; }
  .field-err {
    font-size: 0.82rem;
    color: #991b1b;
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

  @media (max-width: 420px) {
    .page { padding: 1.25rem 0.75rem; }
    .card-top { padding: 1.25rem 1.25rem 1rem; }
    .card-body { padding: 1.25rem 1.25rem 1.25rem; }
    h1 { font-size: 1.35rem; }
  }
</style>
