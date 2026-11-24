<script lang="ts">
  import { goto } from '$app/navigation'
  import Brand from '$lib/components/Brand.svelte'
  import {
    validateIdentifier, validateChannel, validateResetRequest,
    type FieldErrors
  } from '$lib/reset-validation'
  import { writeResetSession } from '$lib/reset-session'

  let identifier = $state('')
  let channel = $state<'email' | 'sms'>('email')

  let fieldErrors = $state<FieldErrors>({})
  let submitError = $state<string | null>(null)
  let submitting = $state(false)

  function onIdentifierBlur() {
    const err = validateIdentifier(identifier)
    fieldErrors = { ...fieldErrors, identifier: err ?? undefined }
  }

  async function submit(e: Event) {
    e.preventDefault()
    submitError = null
    const errs = validateResetRequest({ identifier, channel })
    fieldErrors = errs
    if (Object.keys(errs).length > 0) return

    submitting = true
    try {
      const res = await fetch('/api/reset-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier, channel })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (body?.errors && typeof body.errors === 'object') fieldErrors = { ...fieldErrors, ...body.errors }
        submitError = body?.message ?? `Request failed (${res.status}). Try again.`
        return
      }
      // /api/reset-request always answers the same way for well-formed input so it cannot
      // be used to enumerate accounts. Carry the identifier + channel forward either way.
      writeResetSession({ identifier: identifier.trim(), channel })
      await goto('/reset/verify')
    } catch {
      submitError = 'Network error - please try again.'
    } finally {
      submitting = false
    }
  }
</script>

<svelte:head><title>Reset your password - Common Good</title></svelte:head>

<main class="auth">
  <div class="auth-card" role="region" aria-labelledby="reset-h1">
    <div class="auth-head">
      <h1 id="reset-h1">Reset your password</h1>
      <p>Tell us how to send you a one-time code.</p>
    </div>

    <form class="stack" onsubmit={submit} novalidate>
      <div class="field">
        <label for="identifier">Account ID, email, or phone</label>
        <input
          id="identifier"
          data-testid="identifier"
          type="text"
          bind:value={identifier}
          onblur={onIdentifierBlur}
          autocomplete="username"
          placeholder="How you sign in"
          aria-invalid={!!fieldErrors.identifier}
        />
        {#if fieldErrors.identifier}<span class="field-err" role="alert">{fieldErrors.identifier}</span>{/if}
      </div>

      <fieldset class="field">
        <legend>Send code by</legend>
        <div class="segmented">
          <label><input type="radio" name="channel" value="email" data-testid="channel-email" bind:group={channel} />Email</label>
          <label><input type="radio" name="channel" value="sms" data-testid="channel-sms" bind:group={channel} />Text message</label>
        </div>
        {#if fieldErrors.channel}<span class="field-err" role="alert">{fieldErrors.channel}</span>{/if}
      </fieldset>

      {#if submitError}
        <p class="alert alert-error" role="alert">{submitError}</p>
      {/if}

      <button type="submit" class="btn btn-primary btn-block" data-testid="btn-send-code" disabled={submitting}>
        {submitting ? 'Sending code...' : 'Send code'}
      </button>
    </form>

    <div class="auth-foot"><p>Remembered it? <a class="link" href="/login">Sign in</a></p></div>
  </div>
</main>

