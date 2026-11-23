<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import Brand from '$lib/components/Brand.svelte'
  import {
    validatePassword, validateConfirmPassword, type FieldErrors
  } from '$lib/reset-validation'
  import { readResetSession, writeResetSession, clearResetSession } from '$lib/reset-session'
  import { pwScore, pwStrengthRatio, PW_MIN_SCORE } from '$lib/pw-score'

  let password = $state('')
  let confirm = $state('')
  let fieldErrors = $state<FieldErrors>({})
  let submitError = $state<string | null>(null)
  let submitting = $state(false)

  let strength = $derived(pwStrengthRatio(password))
  let strengthLabel = $derived(
    password.length === 0 ? '' :
    pwScore(password) >= PW_MIN_SCORE ? 'Strong enough' :
    strength >= 0.6 ? 'Getting there' :
    'Too weak'
  )

  onMount(() => {
    const session = readResetSession()
    if (!session || !session.code) {
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
        body: JSON.stringify({ identifier: session.identifier, code: session.code, newPassword: password })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        // PHP keeps the code usable when only the password was refused, so the member
        // can pick a stronger one without starting over. A bad code sends them back.
        if (body?.errors?.code) {
          // Keep identifier + channel so /reset/verify loads cleanly and asks for a fresh code;
          // drop the stale code. (An inline error carry-over to /reset/verify would be a nice follow-up.)
          const sess = readResetSession()
          if (sess) writeResetSession({ identifier: sess.identifier, channel: sess.channel })
          await goto('/reset/verify')
          return
        }
        if (body?.errors?.newPassword) {
          fieldErrors = { ...fieldErrors, newPassword: body.errors.newPassword }
          return
        }
        submitError = body?.message ?? `Reset failed (${res.status}). Try again.`
        return
      }
      clearResetSession()
      await goto('/', { invalidateAll: true })
    } catch {
      submitError = 'Network error - please try again.'
    } finally {
      submitting = false
    }
  }
</script>

<svelte:head><title>Set your new password - Common Good</title></svelte:head>

<main class="auth">
  <div class="auth-card" role="region" aria-labelledby="pw-h1">
    <div class="auth-head">
      <p class="auth-eyebrow">Reset your password</p>
      <h1 id="pw-h1">Set a new password</h1>
      <p>Pick something you'll remember. The meter shows how strong it is.</p>
    </div>

    <form class="stack" onsubmit={submit} novalidate>
      <div class="field">
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
        {#if password.length > 0}
          <div class="meter" aria-hidden="true">
            <div class="meter-fill" class:weak={strength < 0.6} class:ok={strength >= 0.6 && strength < 1} class:strong={strength >= 1} style="width: {strength * 100}%"></div>
          </div>
          <span class="meter-label" class:strong={strength >= 1}>{strengthLabel}</span>
        {/if}
        {#if fieldErrors.newPassword}<span class="field-err" role="alert">{fieldErrors.newPassword}</span>{/if}
      </div>

      <div class="field">
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
        {#if fieldErrors.confirmPassword}<span class="field-err" role="alert">{fieldErrors.confirmPassword}</span>{/if}
      </div>

      {#if submitError}
        <p class="alert alert-error" role="alert">{submitError}</p>
      {/if}

      <button type="submit" class="btn btn-primary btn-block" data-testid="btn-set-password" disabled={submitting}>
        {submitting ? 'Setting password...' : 'Set password'}
      </button>
    </form>
  </div>
</main>


<style>
  .meter { height: 4px; background: var(--cg-border); border-radius: 2px; overflow: hidden; }
  .meter-fill { height: 100%; transition: width var(--dur) var(--ease-out), background-color var(--dur); }
  .meter-fill.weak { background: var(--cg-error); }
  .meter-fill.ok { background: #d97706; }
  .meter-fill.strong { background: var(--cg-green); }
  .meter-label { font-size: var(--fs-sm); color: var(--cg-text-muted); }
  .meter-label.strong { color: var(--cg-green); }
</style>
