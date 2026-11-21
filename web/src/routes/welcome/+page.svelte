<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'
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

<main class="container welcome">
  <div class="hero">
    <h1>Join Common Good</h1>
    <p>An economy owned by the people who use it. Which best describes you?</p>
  </div>

  <section class="roles" aria-labelledby="roles-title">
    <h2 id="roles-title" class="sr-only">Choose your role</h2>
    <a class="role card primary" href="/signup" data-testid="lnk-member">
      <span class="role-text"><strong>Member</strong><span>Join as an individual. Pay, get paid, and keep your money in your community.</span></span>
      <Icon name="chevron" size={20} />
    </a>
    <a class="role card" href={businessHref} data-testid="lnk-business">
      <span class="role-text"><strong>Business</strong><span>Register your business or organization. Accept Common Good credit from customers and pay vendors.</span></span>
      <Icon name="chevron" size={20} />
    </a>
    <a class="role card" href={sponseeHref} data-testid="lnk-sponsee">
      <span class="role-text"><strong>Fiscal Sponsee</strong><span>Apply for fiscal sponsorship. Accept tax-deductible donations without applying to the IRS.</span></span>
      <Icon name="chevron" size={20} />
    </a>
  </section>

  <p class="signin-row">Already a member? <a class="link" href="/login" data-testid="lnk-signin">Sign in</a></p>
</main>

<style>
  .welcome { display: grid; justify-items: center; gap: var(--sp-6); padding-top: var(--sp-6); }
  .hero { display: grid; justify-items: center; gap: var(--sp-3); text-align: center; max-width: 36rem; }
  .hero h1 { font-size: var(--fs-2xl); font-weight: 700; }
  .hero p { color: var(--cg-text-muted); font-size: var(--fs-md); }

  .roles { display: grid; gap: var(--sp-3); width: 100%; max-width: 34rem; }
  .role {
    display: flex; align-items: center; gap: var(--sp-4); padding: var(--sp-4) var(--sp-5);
    color: var(--cg-text); text-decoration: none; min-height: 88px;
    transition: border-color var(--dur-fast), transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast);
  }
  .role:hover { text-decoration: none; }
  .role:active { transform: scale(0.99); }
  @media (hover: hover) { .role:hover { border-color: var(--cg-green); box-shadow: var(--shadow-2); } }
  .role.primary { border: 2px solid var(--cg-green); }
  .role-text { display: grid; gap: var(--sp-1); flex: 1; }
  .role-text strong { font-size: var(--fs-md); }
  .role-text span { color: var(--cg-text-muted); font-size: var(--fs-sm); line-height: 1.45; }
  .role :global(svg) { color: var(--cg-text-subtle); flex: none; }
  .signin-row { color: var(--cg-text-muted); }

  @media (max-width: 639px) {
    .welcome { padding-top: var(--sp-5); gap: var(--sp-5); }
    .hero h1 { font-size: var(--fs-xl); }
    .hero p { font-size: var(--fs-base); }
  }
</style>
