<script lang="ts">
  import { cardSignIn, confirmCode, type Signed } from './lib/auth'
  import { liveOf, signedInFor } from './lib/env'
  import { mainId, parseQr } from './lib/qr'
  import { onMount } from 'svelte'

  // The scanned card belongs to the other env (a test card: demo; a real card: back to the env the app started at). Asks first, then signs in there by the card.
  let { qr, to, onswitched, onreuse, oncancel }: { qr: string, to: string, onswitched: (s: Signed) => void, onreuse: () => void, oncancel: () => void } = $props()
  const demo = $derived(to === 'demo')
  let skip = $state(true), password = $state(''), code = $state(''), trust = $state(false)
  let mfa = $state(''), error = $state(''), busy = $state(false), asked = $state(false), reuse = $state(false)

  const MESSAGES: Record<string, string> = {
    'bad-card': 'That card is not valid.', 'wrong-kind': 'That card cannot be used here.', 'bad-login': 'That password is not right.', 'password-needed': 'Enter the cardholder\'s password.',
    flooding: 'Too many attempts. Try again later.', 'bad-code': 'That code is not right.', expired: 'That code has expired. Scan the card again.', 'bad-handle': 'That code has expired. Scan the card again.',
    'not-ok': 'This account cannot sign in yet.', 'weak-admin-password': 'Your administrator password is too weak. Please reset it.', offline: 'No connection. Connect to the internet to switch.'
  }

  // Already signed in there for this card's account: switching back needs no password.
  onMount(async () => { try { reuse = await signedInFor(to, mainId(parseQr(qr, !demo).acct), mainId) } catch {} })

  async function go(step: () => ReturnType<typeof cardSignIn>) {
    error = ''; busy = true
    try {
      const { data } = await step()
      if (data.token) onswitched(data as Signed)
      else if (data.mfa) { mfa = data.mfa; code = '' }
      else { error = MESSAGES[data.error] ?? 'Switching failed. Try again.'; if (data.error === 'expired' || data.error === 'bad-handle') mfa = '' }
    } catch { error = MESSAGES.offline } finally { busy = false }
  }
</script>

<section class="page">
  {#if !mfa}
    <h1 data-testid="switch-title">{demo ? 'Switch to DEMO?' : 'Switch back?'}</h1>
    <p data-testid="switch-text">{demo ? 'That is a test card. The app will switch to demo mode, where no money is real, and sign in as the card\'s account.' : 'That is a real card. The app will leave demo mode and sign in as the card\'s account.'}</p>
    <form onsubmit={e => { e.preventDefault(); reuse ? onreuse() : go(() => cardSignIn(to, qr, password, demo && skip)) }}>
      {#if demo}
        <label class="check"><input data-testid="skip-mfa" type="checkbox" bind:checked={skip} /> Skip MFA in demo</label>
      {:else if !reuse}
        <label>Password<input data-testid="password" type="password" bind:value={password} autocomplete="current-password" /></label>
      {/if}
      {#if error}<p class="err" role="alert">{error}</p>{/if}
      <button data-testid="btn-switch" disabled={busy || (!demo && !reuse && !password)}>{busy ? 'Switching...' : 'Switch'}</button>
      <button type="button" class="plain" data-testid="btn-stay" onclick={oncancel}>Cancel</button>
    </form>
  {:else}
    <h1>Confirm</h1>
    <p>To be sure it is really you, we sent you a passcode by email. Enter it below.</p>
    <form onsubmit={e => { e.preventDefault(); go(() => confirmCode(mfa, code.trim(), trust, liveOf(to))) }}>
      <label>Passcode<input data-testid="code" bind:value={code} inputmode="numeric" autocomplete="one-time-code" /></label>
      <label class="check"><input data-testid="trust" type="checkbox" bind:checked={trust} /> Trust this device</label>
      {#if error}<p class="err" role="alert">{error}</p>{/if}
      <button data-testid="btn-confirm" disabled={busy || !code}>{busy ? 'Checking...' : 'Confirm'}</button>
      <button type="button" class="plain" data-testid="btn-stay" onclick={oncancel}>Cancel</button>
    </form>
  {/if}
</section>

<style>
  h1, p { text-align: center; }
  form { display: grid; gap: 14px; }
  label { display: grid; gap: 4px; font-size: 0.85rem; font-weight: 600; }
  label.check { display: flex; align-items: center; gap: 8px; font-weight: 400; }
  input:not([type='checkbox']) { padding: 10px 12px; font: inherit; border: 1px solid #e4e8e4; border-radius: 8px; }
  button.plain { background: none; border: 1px solid #1e7a3a; color: #1e7a3a; }
  .err { margin: 0; padding: 10px 12px; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 8px; font-size: 0.88rem; }
</style>
