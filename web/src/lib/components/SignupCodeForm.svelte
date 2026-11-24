<script lang="ts">
  import { goto } from '$app/navigation'
  import { validateCode } from '$lib/signup-validation'
  import { readSignupSession, writeSignupSession } from '$lib/signup-session'

  let { code = $bindable(''), qid = '' }: { code?: string, qid?: string } = $props()
  let codeError = $state<string | null>(null)
  let submitting = $state(false)

  async function submit(e: Event) {
    e.preventDefault()
    if (codeError = validateCode(code)) return
    submitting = true
    const session = readSignupSession()
    writeSignupSession({ uid: session?.uid ?? 0, qid: qid || session?.qid || '', code: code.trim() })
    await goto('/signup/password')
  }
</script>

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
      onblur={() => codeError = validateCode(code)}
      placeholder="paste or type the code"
      aria-invalid={!!codeError}
    />
    {#if codeError}<span class="field-err">{codeError}</span>{/if}
  </div>

  <button type="submit" class="btn btn-primary btn-block" data-testid="btn-verify" disabled={submitting}>
    {submitting ? 'Checking...' : 'Continue'}
  </button>
</form>
