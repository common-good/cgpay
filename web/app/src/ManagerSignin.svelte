<script lang="ts">
  // A locked cash register asks for a manager: scan a manager's card (works offline too, for a card that unlocked this phone online before), or type the password of the member signed in here (owner).
  let { owner = '', onscan, onpassword, oncancel, error = '', busy = false }: { owner?: string, onscan: () => void, onpassword: (password: string) => void, oncancel: () => void, error?: string, busy?: boolean } = $props()
  let typing = $state(false), password = $state('')
</script>

<div class="dialog" role="alertdialog" aria-labelledby="mgr-title" data-testid="manager-signin">
  <h2 id="mgr-title">Manager Sign-in</h2>
  <p>Menus, settings, and payments (including refunds) are available only to a manager.</p>
  {#if typing}
    <form onsubmit={e => { e.preventDefault(); onpassword(password) }}>
      <label>Password{owner ? ` of ${owner}` : ''} <input type="password" data-testid="password" bind:value={password} autocomplete="current-password" /></label>
      {#if error}<p class="err" role="alert" data-testid="unlock-error">{error}</p>{/if}
      <button data-testid="btn-unlock" disabled={busy || !password}>Unlock</button>
      <button type="button" class="out" data-testid="btn-cancel-manager" onclick={oncancel}>Cancel</button>
    </form>
  {:else}
    {#if error}<p class="err" role="alert" data-testid="unlock-error">{error}</p>{/if}
    <button data-testid="btn-scan-in" onclick={onscan} disabled={busy}>Scan-in</button>
    <button class="alt" data-testid="btn-password" onclick={() => typing = true}>Password</button>
    {#if owner}<small>the password of {owner}</small>{/if}
    <button class="out" data-testid="btn-cancel-manager" onclick={oncancel}>Cancel</button>
  {/if}
</div>

<style>
  .dialog { position: fixed; inset: auto 16px 50% 16px; transform: translateY(50%); max-width: 448px; margin: 0 auto; z-index: 20; display: flex; flex-direction: column; gap: 10px; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.35), 0 8px 24px rgba(0, 0, 0, 0.2); }
  h2 { margin: 0; color: #0946A6; font-size: 1.25rem; }
  p { margin: 0 0 6px; }
  form { display: flex; flex-direction: column; gap: 10px; }
  label { display: flex; flex-direction: column; gap: 6px; font-weight: 600; }
  input { font: inherit; padding: 12px; border: 1px solid #ccd3cd; border-radius: 8px; }
  small { margin-top: -6px; text-align: center; color: #5a615e; }
  .err { color: #b3261e; }
  .alt { background: none; border: 1px solid #1e7a3a; color: #1e7a3a; }
  .out { background: none; color: #0946A6; }
</style>
