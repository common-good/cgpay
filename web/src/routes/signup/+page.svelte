<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { env } from '$env/dynamic/public'
  import Brand from '$lib/components/Brand.svelte'
  import {
    validateFullName, validateEmail, validatePhone, validateZip, validateAgreement,
    validateSignup, type FieldErrors
  } from '$lib/signup-validation'
  import { writeSignupSession } from '$lib/signup-session'

  // Cloudflare Turnstile. The widget is invisible by default: it posts the
  // token into a hidden input named `cf-turnstile-response` inside its container,
  // and we read it off the DOM at submit time. The script tag + widget div are
  // all that's needed to activate it; no npm package.
  const turnstileSitekey = env.PUBLIC_TURNSTILE_SITEKEY as string
  let turnstileEl = $state<HTMLDivElement | null>(null)

  let fullName = $state('')
  let email = $state('')
  let phone = $state('')
  let zip = $state('')
  let agreementAccepted = $state(false)
  let outsideUS = $state(false)
  // Country stub: 1228 is PHP's US_COUNTRY_ID. Non-US gets expanded later; for
  // now the "Not in the US?" link just reveals a message that non-US isn't
  // supported yet in this flow.
  let country = $state<number | undefined>(undefined)

  let fieldErrors = $state<FieldErrors>({})
  let submitError = $state<string | null>(null)
  let submitting = $state(false)

  onMount(() => {
    // Load the Turnstile script once per page load. The widget div with the
    // cf-turnstile class auto-renders when the script boots.
    if (document.getElementById('cf-turnstile-script')) return
    const s = document.createElement('script')
    s.id = 'cf-turnstile-script'
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    s.async = true
    s.defer = true
    document.head.appendChild(s)
  })

  function readTurnstileToken(): string {
    const input = turnstileEl?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')
    return input?.value ?? ''
  }

  function onBlur(field: keyof FieldErrors, msg: string | null) {
    fieldErrors = { ...fieldErrors, [field]: msg ?? undefined }
  }

  async function submit(e: Event) {
    e.preventDefault()
    submitError = null
    const input = { fullName, email, phone, zip, country, agreementAccepted }
    const errs = validateSignup(input, !outsideUS)
    fieldErrors = errs
    if (Object.keys(errs).length > 0) return

    submitting = true
    try {
      const captchaToken = readTurnstileToken()
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...input, captchaToken })
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        // Field-level errors from PHP merge in so the user sees them inline.
        if (body?.errors && typeof body.errors === 'object') fieldErrors = { ...fieldErrors, ...body.errors }
        submitError = body?.message ?? `Sign up failed (${res.status}). Try again.`
        return
      }
      const body = await res.json().catch(() => ({}))
      if (typeof body.uid === 'number' && typeof body.qid === 'string') {
        writeSignupSession({ uid: body.uid, qid: body.qid })
      }
      await goto('/signup/check-email')
    } catch {
      submitError = 'Network error - please try again.'
    } finally {
      submitting = false
    }
  }
</script>

<svelte:head><title>Join Common Good</title></svelte:head>

<main class="page">
  <div class="card" role="region" aria-labelledby="signup-h1">
    <div class="card-top">
      <Brand size={40} />
      <p class="tagline">Join Common Good - it takes about 2 minutes</p>
    </div>

    <div class="card-body">
      <h1 id="signup-h1">Create your account</h1>
      <p class="subtitle">Already have an account? <a class="inline-link" href="/login">Sign in</a>.</p>

      <form onsubmit={submit} novalidate>
        <div class="field" class:has-err={fieldErrors.fullName}>
          <label for="fullName">Full name</label>
          <input
            id="fullName"
            data-testid="fullName"
            type="text"
            bind:value={fullName}
            onblur={() => onBlur('fullName', validateFullName(fullName))}
            autocomplete="name"
            placeholder="First and last name"
            aria-invalid={!!fieldErrors.fullName}
          />
          {#if fieldErrors.fullName}<span class="field-err">{fieldErrors.fullName}</span>{/if}
        </div>

        <div class="field" class:has-err={fieldErrors.email}>
          <label for="email">Email</label>
          <input
            id="email"
            data-testid="email"
            type="email"
            bind:value={email}
            onblur={() => onBlur('email', validateEmail(email))}
            autocomplete="email"
            placeholder="you@example.com"
            aria-invalid={!!fieldErrors.email}
          />
          {#if fieldErrors.email}<span class="field-err">{fieldErrors.email}</span>{/if}
        </div>

        <div class="field" class:has-err={fieldErrors.phone}>
          <label for="phone">Phone</label>
          <input
            id="phone"
            data-testid="phone"
            type="tel"
            bind:value={phone}
            onblur={() => onBlur('phone', validatePhone(phone))}
            autocomplete="tel"
            placeholder="(555) 555-1234"
            aria-invalid={!!fieldErrors.phone}
          />
          {#if fieldErrors.phone}<span class="field-err">{fieldErrors.phone}</span>{/if}
        </div>

        <div class="field" class:has-err={fieldErrors.zip}>
          <label for="zip">ZIP code</label>
          <input
            id="zip"
            data-testid="zip"
            type="text"
            inputmode="numeric"
            bind:value={zip}
            onblur={() => onBlur('zip', validateZip(zip, !outsideUS))}
            autocomplete="postal-code"
            placeholder="02139"
            aria-invalid={!!fieldErrors.zip}
          />
          {#if fieldErrors.zip}<span class="field-err">{fieldErrors.zip}</span>{/if}
        </div>

        <div class="field toggle-row">
          <button type="button" class="link-button" onclick={() => (outsideUS = !outsideUS)} aria-expanded={outsideUS}>
            {outsideUS ? 'I am in the US' : 'Not in the US?'}
          </button>
          {#if outsideUS}
            <p class="note">Non-US sign-up isn't supported in this flow yet. Please use the <a class="inline-link" href="/login">classic sign-up on the member site</a>.</p>
          {/if}
        </div>

        <div class="field agreement" class:has-err={fieldErrors.agreementAccepted}>
          <label>
            <input
              type="checkbox"
              data-testid="agreement"
              bind:checked={agreementAccepted}
              onblur={() => onBlur('agreementAccepted', validateAgreement(agreementAccepted))}
            />
            <span>I agree to the <a class="inline-link" href="/agreement" target="_blank" rel="noopener">Common Good Agreement</a>.</span>
          </label>
          {#if fieldErrors.agreementAccepted}<span class="field-err">{fieldErrors.agreementAccepted}</span>{/if}
        </div>

        <div class="turnstile" bind:this={turnstileEl}>
          <div class="cf-turnstile" data-sitekey={turnstileSitekey} data-size="flexible"></div>
        </div>

        {#if submitError}
          <p class="err" role="alert">{submitError}</p>
        {/if}

        <button type="submit" class="primary" data-testid="btn-signup" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create my account'}
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
  .tagline {
    margin: 0;
    color: var(--cg-on-navy-muted);
    font-size: 0.88rem;
    font-weight: 400;
    letter-spacing: 0.01em;
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

  input[type="text"], input[type="email"], input[type="tel"] {
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
  .has-err input:not([type="checkbox"]) {
    border-color: #dc2626;
  }
  .field-err {
    font-size: 0.82rem;
    color: #991b1b;
  }

  .agreement label {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-weight: 400;
    font-size: 0.9rem;
    cursor: pointer;
  }
  .agreement input[type="checkbox"] { margin-top: 0.2rem; }

  .toggle-row { gap: 0.4rem; }
  .link-button {
    background: none;
    border: none;
    padding: 0;
    color: var(--cg-green);
    font-size: 0.85rem;
    cursor: pointer;
    text-align: left;
    text-decoration: underline;
  }
  .link-button:hover { color: var(--cg-green-hover); }
  .note {
    margin: 0;
    padding: 0.6rem 0.75rem;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: var(--cg-radius-sm);
    font-size: 0.85rem;
    color: #7c2d12;
  }
  .inline-link { color: var(--cg-green); text-decoration: underline; }
  .inline-link:hover { color: var(--cg-green-hover); }

  .turnstile {
    display: flex;
    justify-content: center;
    min-height: 65px;
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
