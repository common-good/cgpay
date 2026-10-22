<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import Brand from '$lib/components/Brand.svelte'
  import { validateCode } from '$lib/signup-validation'
  import { readSignupSession, writeSignupSession } from '$lib/signup-session'

  let code = $state('')
  let codeError = $state<string | null>(null)
  let submitting = $state(false)
  let qid = $state('')

  onMount(() => {
    const session = readSignupSession()
    if (!session) {
      // No signup in progress on this device - send them back to the start.
      goto('/signup')
      return
    }
    qid = session.qid
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
    if (!session) {
      await goto('/signup')
      return
    }
    writeSignupSession({ ...session, code: code.trim() })
    await goto('/signup/password')
  }
</script>

<svelte:head><title>Verify your email - Common Good</title></svelte:head>

<main class="page">
  <div class="card" role="region" aria-labelledby="verify-h1">
    <div class="card-top">
      <Brand size={40} />
      <p class="tagline">One quick step to finish signing up</p>
    </div>

    <div class="card-body">
      <h1 id="verify-h1">Enter your code</h1>
      <p class="subtitle">Enter the code from the email we sent you{qid ? `, so we can finish setting up account ${qid}` : ''}.</p>

      <form onsubmit={submit} novalidate>
        <div class="field" class:has-err={codeError}>
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

        <button type="submit" class="primary" data-testid="btn-verify" disabled={submitting}>
          {submitting ? 'Checking…' : 'Continue'}
        </button>
      </form>

      <div class="foot">
        <a class="inline-link" href="/signup/check-email">Didn't get the email?</a>
      </div>
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
    max-width: 420px;
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

  input {
    padding: 0.75rem 0.9rem;
    font-size: 1.1rem;
    letter-spacing: 0.08em;
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    background: var(--cg-surface);
    color: var(--cg-text);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  input::placeholder { color: #aab1ad; letter-spacing: normal; font-size: 0.95rem; }
  input:focus {
    outline: none;
    border-color: var(--cg-green);
    box-shadow: 0 0 0 3px var(--cg-green-soft);
  }
  .has-err input { border-color: #dc2626; }
  .field-err {
    font-size: 0.82rem;
    color: #991b1b;
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

  .foot {
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--cg-border);
    text-align: center;
  }
  .inline-link {
    color: var(--cg-text-muted);
    font-size: 0.85rem;
    text-decoration: none;
  }
  .inline-link:hover { color: var(--cg-green); text-decoration: underline; }

  @media (max-width: 420px) {
    .page { padding: 1.25rem 0.75rem; }
    .card-top { padding: 1.25rem 1.25rem 1rem; }
    .card-body { padding: 1.25rem 1.25rem 1.25rem; }
    h1 { font-size: 1.35rem; }
  }
</style>
