<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import Brand from '$lib/components/Brand.svelte'
  import { validateCode } from '$lib/signup-validation'
  import { readSignupSession, writeSignupSession } from '$lib/signup-session'

  let code = $state('')
  let codeError = $state<string | null>(null)
  let submitting = $state(false)
  let qid = $state('')

  onMount(() => {
    // Email-link flow: the verification email carries ?qid=...&code=... so the
    // member can finish in a new tab or on a different device. Prefer those URL
    // params; only fall back to sessionStorage (same-tab flow) if the URL has nothing.
    const urlCode = (page.url.searchParams.get('code') ?? '').trim()
    const urlQid = (page.url.searchParams.get('qid') ?? '').trim()
    const session = readSignupSession()

    if (urlQid) qid = urlQid
    else if (session) qid = session.qid

    if (urlCode) code = urlCode

    if (!urlQid && !session) {
      // No signup context at all (no URL params, no sessionStorage) - send
      // them to the start. The /api/signup-verify endpoint can take either
      // uid (from session) or qid (from URL), so one is enough.
      goto('/signup')
      return
    }

    // Seed sessionStorage from the URL so the /signup/password step (which
    // reads from session) has what it needs. uid stays 0 when we only have qid.
    if (urlQid && (!session || session.qid !== urlQid)) {
      writeSignupSession({ uid: session?.uid ?? 0, qid: urlQid })
    }
  })

  function onBlur() {
    codeError = validateCode(code)
  }

  async function submit(e: Event) {
    e.preventDefault()
    const err = validateCode(code)
    codeError = err
    if (err) return

    submitting = true
    const session = readSignupSession()
    writeSignupSession({ uid: session?.uid ?? 0, qid: qid || session?.qid || '', code: code.trim() })
    await goto('/signup/password')
  }
</script>

<svelte:head><title>Verify your email - Common Good</title></svelte:head>

<main class="auth">
  <div class="auth-card" role="region" aria-labelledby="verify-h1">
    <div class="auth-head">
      <p class="auth-eyebrow">One quick step to finish signing up</p>
      <h1 id="verify-h1">Enter your code</h1>
      <p>Enter the code from the email we sent you{qid ? `, so we can finish setting up account ${qid}` : ''}.</p>
    </div>

    <form class="stack" onsubmit={submit} novalidate>
      <div class="field">
        <label for="code">Verification code</label>
        <input
          id="code"
          data-testid="code"
          type="text"
          inputmode="text"
          autocomplete="one-time-code"
          bind:value={code}
          onblur={onBlur}
          placeholder="paste or type the code"
          aria-invalid={!!codeError}
        />
        {#if codeError}<span class="field-err">{codeError}</span>{/if}
      </div>

      <button type="submit" class="btn btn-primary btn-block" data-testid="btn-verify" disabled={submitting}>
        {submitting ? 'Checking...' : 'Continue'}
      </button>
    </form>

    <div class="auth-foot">
      <a class="link" href="/signup/check-email">Didn't get the email?</a>
    </div>
  </div>
</main>

