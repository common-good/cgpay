<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import Brand from '$lib/components/Brand.svelte'
  import { validateCode } from '$lib/reset-validation'
  import { readResetSession, writeResetSession } from '$lib/reset-session'

  let code = $state('')
  let codeError = $state<string | null>(null)
  let submitting = $state(false)
  let channelLabel = $state('')

  onMount(() => {
    const session = readResetSession()
    if (!session) {
      // No reset in progress on this device - start over.
      goto('/reset')
      return
    }
    channelLabel = session.channel === 'sms' ? 'phone or email' : 'email'
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
    const session = readResetSession()
    if (!session) {
      await goto('/reset')
      return
    }
    writeResetSession({ ...session, code: code.trim() })
    await goto('/reset/password')
  }
</script>

<svelte:head><title>Enter your code - Common Good</title></svelte:head>

<main class="auth">
  <div class="auth-card" role="region" aria-labelledby="verify-h1">
    <div class="auth-head">
      <p class="auth-eyebrow">Reset your password</p>
      <h1 id="verify-h1">Enter your code</h1>
      <p>We sent a code to your {channelLabel || 'account'}. Enter it below.</p>
    </div>

    <form class="stack" onsubmit={submit} novalidate>
      <div class="field">
        <label for="code">Code</label>
        <input
          id="code"
          data-testid="code"
          class="code-input"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          bind:value={code}
          onblur={onBlur}
          placeholder="123456"
          aria-invalid={!!codeError}
        />
        {#if codeError}<span class="field-err" role="alert">{codeError}</span>{/if}
      </div>

      <button type="submit" class="btn btn-primary btn-block" data-testid="btn-verify" disabled={submitting}>
        {submitting ? 'Checking...' : 'Continue'}
      </button>
    </form>

    <div class="auth-foot"><p>Didn't get the code? <a class="link" href="/reset" data-testid="lnk-restart">Start over</a></p></div>
  </div>
</main>

