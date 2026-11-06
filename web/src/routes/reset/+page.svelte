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
      // Identifier-enumeration guard: PHP always returns 200 for shape consistency,
      // whether or not the identifier matched. Trust the uid+qid when present;
      // otherwise still route the member forward so the form does not leak which
      // identifiers exist.
      if (typeof body.uid === 'number' && typeof body.qid === 'string') {
        writeResetSession({ uid: body.uid, qid: body.qid, channel })
      } else {
        writeResetSession({ uid: 0, qid: '', channel })
      }
      await goto('/reset/verify')
    } catch {
      submitError = 'Network error - please try again.'
    } finally {
      submitting = false
    }
  }
</script>

<svelte:head><title>Reset your password - Common Good</title></svelte:head>

<main class="page">
  <div class="card" role="region" aria-labelledby="reset-h1">
    <div class="card-top">
      <Brand size={40} />
      <p class="tagline">Reset your password</p>
    </div>

    <div class="card-body">
      <h1 id="reset-h1">Forgot your password?</h1>
      <p class="subtitle">Tell us how to send you a one-time code.</p>

      <form onsubmit={submit} novalidate>
        <div class="field" class:has-err={fieldErrors.identifier}>
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
          {#if fieldErrors.identifier}<span class="field-err">{fieldErrors.identifier}</span>{/if}
        </div>

        <fieldset class="field channel" class:has-err={fieldErrors.channel}>
          <legend>Send code by</legend>
          <label class="radio">
            <input type="radio" name="channel" value="email" data-testid="channel-email" bind:group={channel} />
            <span>Email</span>
          </label>
          <label class="radio">
            <input type="radio" name="channel" value="sms" data-testid="channel-sms" bind:group={channel} />
            <span>Text message</span>
          </label>
          {#if fieldErrors.channel}<span class="field-err">{fieldErrors.channel}</span>{/if}
        </fieldset>

        {#if submitError}
          <p class="err" role="alert">{submitError}</p>
        {/if}

        <button type="submit" class="primary" data-testid="btn-send-code" disabled={submitting}>
          {submitting ? 'Sending code…' : 'Send code'}
        </button>
      </form>

      <p class="back-row">
        Remembered it? <a class="inline-link" href="/login">Sign in</a>
      </p>
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
  legend {
    padding: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--cg-text);
  }

  input[type="text"] {
    padding: 0.65rem 0.8rem;
    font-size: 0.95rem;
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    background: var(--cg-surface);
    color: var(--cg-text);
  }
  input::placeholder { color: #aab1ad; }
  input:focus {
    outline: none;
    border-color: var(--cg-green);
    box-shadow: 0 0 0 3px var(--cg-green-soft);
  }
  .has-err input:not([type="radio"]) {
    border-color: #dc2626;
  }
  .field-err {
    font-size: 0.82rem;
    color: #991b1b;
  }

  .channel {
    border: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.35rem;
  }
  .radio {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 400;
    font-size: 0.95rem;
    cursor: pointer;
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

  .back-row {
    margin: 1.25rem 0 0;
    font-size: 0.9rem;
    color: var(--cg-text-muted);
  }
  .inline-link { color: var(--cg-green); text-decoration: underline; }
  .inline-link:hover { color: var(--cg-green-hover); }

  @media (max-width: 420px) {
    .page { padding: 1.25rem 0.75rem; }
    .card-top { padding: 1.25rem 1.25rem 1rem; }
    .card-body { padding: 1.25rem 1.25rem 1.25rem; }
    h1 { font-size: 1.35rem; }
  }
</style>
