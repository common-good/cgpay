<script lang="ts">
  // Unlock a cash register: a manager scans their card (works offline too, for a card that unlocked this phone online before), or the signed-in member types their password.
  let { onscan, onpassword, error = '', busy = false }: { onscan: () => void, onpassword: (password: string) => void, error?: string, busy?: boolean } = $props()
  let password = $state('')
</script>

<h1>Manager</h1>
<p>Scan a manager's card to unlock.</p>
<button data-testid="btn-scan-manager" onclick={onscan} disabled={busy}>Scan manager's card</button>
<form onsubmit={e => { e.preventDefault(); onpassword(password) }}>
  <label>Or the password of the account signed in here <input type="password" data-testid="password" bind:value={password} autocomplete="current-password" /></label>
  {#if error}<p class="err" role="alert" data-testid="unlock-error">{error}</p>{/if}
  <button data-testid="btn-unlock" disabled={busy || !password}>Unlock</button>
</form>

<style>
  form { display: flex; flex-direction: column; gap: 14px; margin-top: 24px; }
  label { display: flex; flex-direction: column; gap: 6px; font-weight: 600; }
  input { font: inherit; padding: 12px; border: 1px solid #ccd3cd; border-radius: 8px; }
  .err { color: #b3261e; margin: 0; }
  button[data-testid="btn-scan-manager"] { width: 100%; }
</style>
