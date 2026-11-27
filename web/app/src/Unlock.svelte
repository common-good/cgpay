<script lang="ts">
  import { unlock } from './lib/auth'

  // The password again, before changing account or settings (the settings ask for it). It needs a connection, so offline they stay locked.
  let { onunlocked }: { onunlocked: () => void } = $props()
  let password = $state(''), error = $state(''), busy = $state(false)
  const MESSAGES: Record<string, string> = { 'bad-login': 'That password is not right.', flooding: 'Too many attempts. Try again later.', 'bad-token': 'Sign in again.' }

  async function go() {
    error = ''; busy = true
    try {
      const { data } = await unlock({ password })
      if (data.ok) onunlocked(); else error = MESSAGES[data.error] ?? 'That did not work. Try again.'
    } catch { error = 'No connection. Connect to the internet to unlock.' } finally { busy = false }
  }
</script>

<h1>Sign in to continue</h1>
<form onsubmit={e => { e.preventDefault(); go() }}>
  <label>Password <input type="password" data-testid="password" bind:value={password} autocomplete="current-password" /></label>
  {#if error}<p class="err" role="alert">{error}</p>{/if}
  <button data-testid="btn-unlock" disabled={busy || !password}>Continue</button>
</form>

<style>
  form { display: flex; flex-direction: column; gap: 14px; }
  label { display: flex; flex-direction: column; gap: 6px; font-weight: 600; }
  input { font: inherit; padding: 12px; border: 1px solid #ccd3cd; border-radius: 8px; }
  .err { color: #b3261e; margin: 0; }
</style>
