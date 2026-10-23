<script lang="ts">
  import Brand from '$lib/components/Brand.svelte'
</script>

<svelte:head><title>Check your email - Common Good</title></svelte:head>

<main class="page">
  <div class="card">
    <div class="card-top">
      <Brand size={40} />
      <p class="tagline">A fiscally sponsored economy for the common good</p>
    </div>
    <div class="card-body">
      <h1>Check your email</h1>
      <p>We just sent you a message with a 6-digit code. Enter the code on the verification page to finish setting up your account.</p>
      <p class="muted">The code-entry page is in the next release. For now, this screen confirms the sign-up form reached the server.</p>
      <div class="foot">
        <a class="inline-link" href="/login">Back to sign in</a>
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
    background: var(--cg-bg);
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
    margin: 0 0 0.75rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--cg-text);
  }
  p { color: var(--cg-text); line-height: 1.5; margin: 0 0 1rem; }
  .muted { color: var(--cg-text-muted); font-size: 0.88rem; }
  .foot { margin-top: 1rem; text-align: center; }
  .inline-link { color: var(--cg-green); text-decoration: underline; }
</style>
