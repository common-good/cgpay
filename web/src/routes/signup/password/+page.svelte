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
        body: JSON.stringify({ uid: session.uid, qid: session.qid, code: session.code, newPassword: password })
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

<main class="auth">
  <div class="auth-card" role="region" aria-labelledby="pw-h1">
    <div class="auth-head">
      <p class="auth-eyebrow">Last step - choose a password</p>
      <h1 id="pw-h1">Set your password</h1>
      <p>You'll use this every time you sign in.</p>
    </div>

    <form class="stack" onsubmit={submit} novalidate>
      <div class="field">
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

      <div class="field">
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
        <p class="alert alert-error" role="alert">{submitError}</p>
      {/if}

      <button type="submit" class="btn btn-primary btn-block" data-testid="btn-set-password" disabled={submitting}>
        {submitting ? 'Finishing up...' : 'Finish signing up'}
      </button>
    </form>
  </div>
</main>

