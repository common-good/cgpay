<script lang="ts">
  import Brand from '$lib/components/Brand.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  // Business + fiscal-sponsee flows still live on PHP (deferred wizard rebuilds
  // per Jose's UX doc sections 6 and 7). Point the CTAs at those PHP routes
  // through PUBLIC_PHP_BASE_URL. Member signup is already on node.
  const phpBase = $derived(data.phpBase.replace(/\/$/, ''))
  const businessHref = $derived(phpBase ? `${phpBase}/signup-co` : '/signup')
  const sponseeHref = $derived(phpBase ? `${phpBase}/co/sponsor` : '/signup')
</script>

<svelte:head><title>Join Common Good</title></svelte:head>

<main class="page">
  <div class="hero">
    <Brand size={48} />
    <h1>Join Common Good</h1>
    <p class="tagline">An economy owned by the people who use it. Which best describes you?</p>
  </div>

  <section class="roles" role="group" aria-labelledby="roles-title">
    <h2 id="roles-title" class="sr-only">Choose your role</h2>

    <article class="card">
      <h3>Member</h3>
      <p>Join as an individual. Pay, get paid, and keep your money in your community.</p>
      <a class="btn primary" href="/signup" data-testid="cta-member">Join as a Member</a>
    </article>

    <article class="card">
      <h3>Business</h3>
      <p>Register your business or organization. Accept Common Good credit from customers and pay vendors.</p>
      <a class="btn" href={businessHref} data-testid="cta-business">Register a business</a>
    </article>

    <article class="card">
      <h3>Fiscal Sponsee</h3>
      <p>Apply for fiscal sponsorship. Accept tax-deductible donations without applying to the IRS.</p>
      <a class="btn" href={sponseeHref} data-testid="cta-sponsee">Apply for sponsorship</a>
    </article>
  </section>

  <p class="signin-row">
    Already a member? <a class="inline-link" href="/login" data-testid="link-signin">Sign in</a>
  </p>
</main>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 1.25rem 4rem;
    gap: 2.5rem;
    background:
      radial-gradient(ellipse at top, #e6f0e6 0%, transparent 55%),
      linear-gradient(180deg, #eaf1ea 0%, var(--cg-bg) 45%);
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    text-align: center;
    max-width: 36rem;
  }
  h1 {
    margin: 0.4rem 0 0;
    font-size: 2.1rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--cg-text);
  }
  .tagline {
    margin: 0;
    font-size: 1rem;
    color: var(--cg-text-muted);
    line-height: 1.4;
  }

  .roles {
    display: grid;
    gap: 1.25rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
    max-width: 60rem;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: var(--cg-shadow);
    padding: 1.5rem 1.4rem;
  }
  .card h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--cg-text);
  }
  .card p {
    margin: 0;
    flex: 1;
    color: var(--cg-text-muted);
    font-size: 0.92rem;
    line-height: 1.45;
  }

  .btn {
    display: inline-block;
    text-align: center;
    padding: 0.65rem 1rem;
    border-radius: var(--cg-radius-sm);
    font-size: 0.95rem;
    font-weight: 600;
    border: 1px solid var(--cg-border);
    background: var(--cg-surface);
    color: var(--cg-text);
    text-decoration: none;
    transition: background 0.15s, border-color 0.15s;
  }
  .btn:hover { background: #f3f6f3; border-color: #c0ccc0; }

  .btn.primary {
    background: var(--cg-green);
    color: white;
    border-color: var(--cg-green);
  }
  .btn.primary:hover { background: var(--cg-green-hover); border-color: var(--cg-green-hover); }

  .signin-row {
    margin: 0;
    font-size: 0.95rem;
    color: var(--cg-text-muted);
  }
  .inline-link { color: var(--cg-green); text-decoration: underline; }
  .inline-link:hover { color: var(--cg-green-hover); }

  .sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0);
    white-space: nowrap; border: 0;
  }

  @media (max-width: 820px) {
    .roles { grid-template-columns: 1fr; max-width: 28rem; }
    .page { padding: 2rem 1rem 3rem; gap: 2rem; }
    h1 { font-size: 1.7rem; }
    .tagline { font-size: 0.95rem; }
  }
</style>
