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
    channelLabel = session.channel === 'sms' ? 'phone' : 'email'
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

<main class="page">
  <div class="card" role="region" aria-labelledby="verify-h1">
    <div class="card-top">
      <Brand size={40} />
      <p class="tagline">Reset your password</p>
    </div>

    <div class="card-body">
      <h1 id="verify-h1">Enter your code</h1>
      <p class="subtitle">We sent a code to your {channelLabel || 'account'}. Enter it below.</p>

      <form onsubmit={submit} novalidate>
        <div class="field" class:has-err={codeError}>
          <label for="code">Code</label>
          <input
            id="code"
            data-testid="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            bind:value={code}
            onblur={onBlur}
            placeholder="123456"
            aria-invalid={!!codeError}
          />
          {#if codeError}<span class="field-err">{codeError}</span>{/if}
        </div>

        <button type="submit" class="primary" data-testid="btn-verify" disabled={submitting}>
          {submitting ? 'Checking…' : 'Continue'}
        </button>
      </form>

      <p class="back-row">
        Didn't get the code? <a class="inline-link" href="/reset" data-testid="lnk-restart">Start over</a>
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
  .tagline { margin: 0; color: var(--cg-on-navy-muted); font-size: 0.88rem; }
  .card-body { padding: 1.75rem 2rem 1.5rem; }
  h1 { margin: 0 0 0.35rem; font-size: 1.55rem; font-weight: 600; color: var(--cg-text); }
  .subtitle { margin: 0 0 1.5rem; color: var(--cg-text-muted); font-size: 0.92rem; }

  form { display: grid; gap: 1rem; }
  .field { display: grid; gap: 0.35rem; }
  label { font-size: 0.85rem; font-weight: 600; color: var(--cg-text); }

  input[type="text"] {
    padding: 0.65rem 0.8rem;
    font-size: 1.1rem;
    letter-spacing: 0.1em;
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    background: var(--cg-surface);
    color: var(--cg-text);
  }
  input::placeholder { color: #aab1ad; letter-spacing: 0.05em; }
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

  .back-row { margin: 1.25rem 0 0; font-size: 0.9rem; color: var(--cg-text-muted); }
  .inline-link { color: var(--cg-green); text-decoration: underline; }
  .inline-link:hover { color: var(--cg-green-hover); }

  @media (max-width: 420px) {
    .page { padding: 1.25rem 0.75rem; }
    .card-top { padding: 1.25rem 1.25rem 1rem; }
    .card-body { padding: 1.25rem 1.25rem 1.25rem; }
    h1 { font-size: 1.35rem; }
  }
</style>
