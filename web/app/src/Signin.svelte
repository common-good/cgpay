<script lang="ts">
  import Brand from '$lib/components/Brand.svelte'
  import { signIn, confirmCode, demoSignIn, type Signed } from './lib/auth'
  import { live, START } from './lib/env'

  // The store app's own sign-in screen: shown when no account is on the phone, so it works without the live site.
  let { onsignedin, ondemo }: { onsignedin: (s: Signed) => void, ondemo: (s: Signed) => void } = $props()

  let identifier = $state(''), password = $state(''), code = $state(''), trust = $state(false)
  let mfa = $state(''), error = $state(''), busy = $state(false)

  const MESSAGES: Record<string, string> = {
    'bad-login': 'Invalid account ID or password.',
    flooding: 'Too many attempts. Try again later.',
    'bad-code': 'That code is not right.',
    expired: 'That code has expired. Sign in again.',
    'bad-handle': 'That code has expired. Sign in again.',
    'not-ok': 'This account cannot sign in yet.',
    'weak-admin-password': 'Your administrator password is too weak. Please reset it.',
    offline: 'No connection. Connect to the internet to sign in.'
  }

  const signInStep = () => signIn(identifier.trim(), password)

  // Run a sign-in step; its reply is a token (done), an mfa handle (next step) or an error code.
  // "demo" and "pass" (what store reviewers are told to type) go to the demo server for a fresh demo account.
  const isDemo = () => START !== 'demo' && identifier.trim().toLowerCase() === 'demo' && password === 'pass'

  async function go(step: () => ReturnType<typeof signIn>) {
    error = ''; busy = true
    try {
      const demo = step === signInStep && isDemo()
      const { data } = await (demo ? demoSignIn() : step())
      if (data.token) (demo ? ondemo : onsignedin)(data as Signed)
      else if (data.mfa) { mfa = data.mfa; code = '' }
      else { error = MESSAGES[data.error] ?? 'Sign in failed. Try again.'; if (data.error === 'expired' || data.error === 'bad-handle') mfa = '' }
    } catch { error = MESSAGES.offline } finally { busy = false }
  }
</script>

<div class="signin">
  <div class="top"><Brand size={36} /></div>
  <div class="body">
    {#if !mfa}
      <h1>Sign in</h1>
      <form onsubmit={e => { e.preventDefault(); go(signInStep) }}>
        <label>Account ID<input data-testid="identifier" id="identifier" bind:value={identifier} autocomplete="username" autocapitalize="none" placeholder="account code, name, email, or phone" /></label>
        <label>Password<input data-testid="password" id="password" type="password" bind:value={password} autocomplete="current-password" /></label>
        {#if error}<p class="err" role="alert">{error}</p>{/if}
        <button class="primary" data-testid="btn-signin" disabled={busy || !identifier || !password}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <p class="links"><a data-testid="lnk-reset" href="{live()}/forgot">Forgot password?</a></p>
      <p class="links">New to Common Good? <a data-testid="lnk-signup" href="{live()}/signup">Create an account</a></p>
    {:else}
      <h1>Confirm</h1>
      <p>To be sure it is really you, we sent you a passcode by email. Enter it below.</p>
      <form onsubmit={e => { e.preventDefault(); go(() => confirmCode(mfa, code.trim(), trust)) }}>
        <label>Passcode<input data-testid="code" id="code" bind:value={code} inputmode="numeric" autocomplete="one-time-code" /></label>
        <label class="check"><input data-testid="trust" id="trust" type="checkbox" bind:checked={trust} /> Trust this device</label>
        {#if error}<p class="err" role="alert">{error}</p>{/if}
        <button class="primary" data-testid="btn-confirm" disabled={busy || !code}>{busy ? 'Checking...' : 'Confirm'}</button>
      </form>
      <p class="links"><button class="link" data-testid="btn-cancel" onclick={() => { mfa = ''; error = '' }}>Back to sign in</button></p>
    {/if}
  </div>
</div>

<style>
  .signin { margin: 0 -16px; }
  .top { background: #0946A6; color: #fff; padding: 20px 20px 16px; }
  .body { padding: 20px; }
  h1 { color: #1a1f1c; margin: 0 0 16px; font-size: 1.5rem; }
  form { display: grid; gap: 14px; }
  label { display: grid; gap: 4px; font-size: 0.85rem; font-weight: 600; }
  label.check { display: flex; align-items: center; gap: 8px; font-weight: 400; }
  input:not([type='checkbox']) { padding: 10px 12px; font: inherit; border: 1px solid #e4e8e4; border-radius: 8px; }
  .primary { font-weight: 600; }
  .primary:disabled { opacity: 0.6; }
  .err { margin: 0; padding: 10px 12px; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 8px; font-size: 0.88rem; }
  .links { margin: 16px 0 0; text-align: center; font-size: 0.9rem; color: #5a615e; }
  .links a, button.link { color: #1e7a3a; font-weight: 600; text-decoration: none; background: none; padding: 0; }
</style>
