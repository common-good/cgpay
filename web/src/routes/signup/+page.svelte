<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { env } from '$env/dynamic/public'
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
  let captchaReady = $state(false)
  let captchaPollTimer: ReturnType<typeof setInterval> | undefined

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
    if (!document.getElementById('cf-turnstile-script')) {
      const s = document.createElement('script')
      s.id = 'cf-turnstile-script'
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      s.async = true
      s.defer = true
      document.head.appendChild(s)
    }
    // Poll for the token so we can enable the submit button + show the member
    // something coherent instead of "Sign up failed (400)" when they submit
    // before Turnstile is ready. Stops once we see a token.
    captchaPollTimer = setInterval(() => {
      if (readTurnstileToken()) {
        captchaReady = true
        clearInterval(captchaPollTimer)
      }
    }, 300)
    return () => clearInterval(captchaPollTimer)
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

    const captchaToken = readTurnstileToken()
    if (!captchaToken) {
      submitError = 'Verification is still loading - please wait a moment and try again.'
      return
    }

    submitting = true
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...input, captchaToken })
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const phpErrors = (body?.errors && typeof body.errors === 'object') ? body.errors as Record<string, string> : {}
        // Captcha errors aren't a field in the form - surface them as the submit error.
        if (phpErrors.captcha) {
          submitError = phpErrors.captcha
          delete phpErrors.captcha
        } else {
          submitError = body?.message ?? `Sign up failed (${res.status}). Try again.`
        }
        // Remaining field-level errors from PHP merge in so the user sees them inline.
        if (Object.keys(phpErrors).length > 0) fieldErrors = { ...fieldErrors, ...phpErrors }
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

<main class="auth">
  <div class="auth-card" role="region" aria-labelledby="signup-h1">
    <div class="auth-head">
    <p class="auth-eyebrow">Join Common Good - it takes about 2 minutes</p>
    <h1 id="signup-h1">Create your account</h1>
    <p>Already have an account? <a class="link" href="/login">Sign in</a></p>
    </div>

    <form class="stack" onsubmit={submit} novalidate>
      <div class="field">
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
        {#if fieldErrors.fullName}<span class="field-err" role="alert">{fieldErrors.fullName}</span>{/if}
      </div>

      <div class="field">
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
        {#if fieldErrors.email}<span class="field-err" role="alert">{fieldErrors.email}</span>{/if}
      </div>

      <div class="field">
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
        {#if fieldErrors.phone}<span class="field-err" role="alert">{fieldErrors.phone}</span>{/if}
      </div>

      <div class="field">
        <div class="label-row">
          <label for="zip">ZIP code</label>
          <button type="button" class="link-button" onclick={() => (outsideUS = !outsideUS)} aria-expanded={outsideUS} aria-controls="non-us">
            {outsideUS ? 'I am in the US' : 'Not in the US?'}
          </button>
        </div>
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
        {#if fieldErrors.zip}<span class="field-err" role="alert">{fieldErrors.zip}</span>{/if}
        {#if outsideUS}
          <p class="alert alert-warn" id="non-us">Non-US sign-up isn't supported in this flow yet. Please use the <a class="link" href="/login">classic sign-up on the member site</a>.</p>
        {/if}
      </div>

      <div class="field">
        <label class="check">
          <input
            type="checkbox"
            data-testid="agreement"
            bind:checked={agreementAccepted}
            onblur={() => onBlur('agreementAccepted', validateAgreement(agreementAccepted))}
          />
          <span>I agree to the <a class="link" href="/agreement" target="_blank" rel="noopener">Common Good Agreement</a>.</span>
        </label>
        {#if fieldErrors.agreementAccepted}<span class="field-err" role="alert">{fieldErrors.agreementAccepted}</span>{/if}
      </div>

      <div class="turnstile" bind:this={turnstileEl}>
        <div class="cf-turnstile" data-sitekey={turnstileSitekey} data-size="flexible"></div>
      </div>

      {#if submitError}
        <p class="alert alert-error" role="alert">{submitError}</p>
      {/if}

      <button type="submit" class="btn btn-primary btn-block" data-testid="btn-signup" disabled={submitting || !captchaReady}>
        {submitting ? 'Creating account...' : (captchaReady ? 'Create my account' : 'Loading verification...')}
      </button>
    </form>
  </div>
</main>

<style>
  .turnstile { display: flex; justify-content: center; min-height: 65px; }
</style>
