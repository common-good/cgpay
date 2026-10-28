<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import Brand from '$lib/components/Brand.svelte'
  import {
    validatePassword, validateConfirmPassword, type FieldErrors
  } from '$lib/reset-validation'
  import { readResetSession, clearResetSession } from '$lib/reset-session'

  let password = $state('')
  let confirm = $state('')
  let fieldErrors = $state<FieldErrors>({})
  let submitError = $state<string | null>(null)
  let submitting = $state(false)

  onMount(() => {
    const session = readResetSession()
    if (!session || !session.code) {
      // No code captured yet - send them to the verify page first.
      goto('/reset/verify')
    }
  })

  function onPasswordBlur() {
    const err = validatePassword(password)
    fieldErrors = { ...fieldErrors, newPassword: err ?? undefined }
    if (confirm) {
      const cErr = validateConfirmPassword(password, confirm)
      fieldErrors = { ...fieldErrors, confirmPassword: cErr ?? undefined }
    }
  }

  function onConfirmBlur() {
    const err = validateConfirmPassword(password, confirm)
    fieldErrors = { ...fieldErrors, confirmPassword: err ?? undefined }
  }

  async function submit(e: Event) {
    e.preventDefault()
    submitError = null
    const pErr = validatePassword(password)
    const cErr = validateConfirmPassword(password, confirm)
    fieldErrors = { newPassword: pErr ?? undefined, confirmPassword: cErr ?? undefined }
    if (pErr || cErr) return

    const session = readResetSession()
    if (!session || !session.code) {
      await goto('/reset/verify')
      return
    }

    submitting = true
    try {
      const res = await fetch('/api/reset-verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uid: session.uid, code: session.code, newPassword: password })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (body?.errors && typeof body.errors === 'object') fieldErrors = { ...fieldErrors, ...body.errors }
        submitError = body?.message ?? `Reset failed (${res.status}). Try again.`
        return
      }
      clearResetSession()
      // SSO cookies are set server-side by /api/reset-verify, same shape as /api/login.
      // invalidateAll so the layout load reruns against the new cookie.
      await goto('/', { invalidateAll: true })
    } catch {
      submitError = 'Network error - please try again.'
    } finally {
      submitting = false
    }
  }
</script>

<svelte:head><title>Set your new password - Common Good</title></svelte:head>

<main class="page">
  <div class="card" role="region" aria-labelledby="pw-h1">
    <div class="card-top">
      <Brand size={40} />
      <p class="tagline">Reset your password</p>
    </div>

    <div class="card-body">
      <h1 id="pw-h1">Set a new password</h1>
      <p class="subtitle">Pick something you'll remember. At least 8 characters.</p>

      <form onsubmit={submit} novalidate>
        <div class="field" class:has-err={fieldErrors.newPassword}>
          <label for="password">New password</label>
          <input
            id="password"
            data-testid="password"
            type="password"
            autocomplete="new-password"
            bind:value={password}
            onblur={onPasswordBlur}
            aria-invalid={!!fieldErrors.newPassword}
          />
          {#if fieldErrors.newPassword}<span class="field-err">{fieldErrors.newPassword}</span>{/if}
        </div>

        <div class="field" class:has-err={fieldErrors.confirmPassword}>
          <label for="confirm">Confirm password</label>
          <input
            id="confirm"
            data-testid="confirm-password"
            type="password"
            autocomplete="new-password"
            bind:value={confirm}
            onblur={onConfirmBlur}
            aria-invalid={!!fieldErrors.confirmPassword}
          />
          {#if fieldErrors.confirmPassword}<span class="field-err">{fieldErrors.confirmPassword}</span>{/if}
        </div>

        {#if submitError}
          <p class="err" role="alert">{submitError}</p>
        {/if}

        <button type="submit" class="primary" data-testid="btn-set-password" disabled={submitting}>
          {submitting ? 'Setting password…' : 'Set password'}
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
    max-width: 460px;
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
  .tagline { margin: 0; color: var(--cg-on-navy-muted); font-size: 0.88rem; }
  .card-body { padding: 1.75rem 2rem 1.5rem; }
  h1 { margin: 0 0 0.35rem; font-size: 1.55rem; font-weight: 600; color: var(--cg-text); }
  .subtitle { margin: 0 0 1.5rem; color: var(--cg-text-muted); font-size: 0.92rem; }

  form { display: grid; gap: 1rem; }
  .field { display: grid; gap: 0.35rem; }
  label { font-size: 0.85rem; font-weight: 600; color: var(--cg-text); }

  input[type="password"] {
    padding: 0.65rem 0.8rem;
    font-size: 0.95rem;
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    background: var(--cg-surface);
    color: var(--cg-text);
  }
  input:focus {
    outline: none;
    border-color: var(--cg-green);
    box-shadow: 0 0 0 3px var(--cg-green-soft);
  }
  .has-err input { border-color: #dc2626; }
  .field-err { font-size: 0.82rem; color: #991b1b; }

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
  }
  .primary:hover:not(:disabled) { background: var(--cg-green-hover); }
  .primary:disabled { opacity: 0.6; cursor: not-allowed; }

  .err {
    margin: -0.25rem 0 0;
    padding: 0.65rem 0.8rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    border-radius: var(--cg-radius-sm);
    font-size: 0.88rem;
  }

  @media (max-width: 420px) {
    .page { padding: 1.25rem 0.75rem; }
    .card-top { padding: 1.25rem 1.25rem 1rem; }
    .card-body { padding: 1.25rem 1.25rem 1.25rem; }
    h1 { font-size: 1.35rem; }
  }
</style>
