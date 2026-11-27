<script lang="ts">
  import { onMount } from 'svelte'
  import { addTyped, choose, current, dftAcct, member, type Account, type Member } from './lib/accounts'
  import { typeAccount } from './lib/auth'

  // Change account: a list of the member's accounts (works offline), or for admins a box to type any account (needs a connection).
  let { ondone }: { ondone: () => void } = $props()

  let m = $state<Member>(), uid = $state(0), dft = $state(false), who = $state(''), error = $state(''), busy = $state(false)
  onMount(async () => {
    m = await member()
    uid = (await current())?.uid ?? 0
    dft = (await dftAcct()) === uid
  })

  const MESSAGES: Record<string, string> = { 'not-found': 'There is no such account.', 'not-allowed': 'You cannot act for that account.', 'bad-token': 'Sign in again.' }

  async function use() {
    error = ''
    if (!who.trim()) {
      const a = m?.accounts.find(a => a.uid === uid)
      if (a) { await choose($state.snapshot(a), dft); ondone() } // a plain copy: the store cannot keep a reactive proxy
      return
    }
    busy = true
    try {
      const { data } = await typeAccount(who.trim())
      if (data.account) { await addTyped(data.account as Account, dft); ondone() }
      else error = MESSAGES[data.error] ?? 'That did not work. Try again.'
    } catch { error = 'No connection. Connect to the internet to type an account.' } finally { busy = false }
  }
</script>

<h1>Change account</h1>
{#if m}
  <form onsubmit={e => { e.preventDefault(); use() }}>
    {#if m.admin}
      <label>Account <input data-testid="who" bind:value={who} placeholder="Name, phone, email or account ID" autocapitalize="off" /></label>
      {#if m.accounts.length > 1}<p class="or">or choose one you used:</p>{/if}
    {/if}
    {#if !m.admin || m.accounts.length > 1}
      <label>Account
        <select data-testid="account" bind:value={uid} onchange={() => who = ''}>
          {#each m.accounts as a}<option value={a.uid}>{a.name}</option>{/each}
        </select>
      </label>
    {/if}
    <label class="check"><input type="checkbox" data-testid="dft" bind:checked={dft} /> Use this account when the app opens</label>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <button data-testid="btn-use" disabled={busy}>Use this account</button>
  </form>
{/if}

<style>
  form { display: flex; flex-direction: column; gap: 14px; }
  label { display: flex; flex-direction: column; gap: 6px; font-weight: 600; }
  .check { flex-direction: row; align-items: center; font-weight: normal; }
  input:not([type]), select { font: inherit; padding: 12px; border: 1px solid #ccd3cd; border-radius: 8px; background: #fff; }
  .or { margin: 0; color: #5a615e; }
  .err { color: #b3261e; margin: 0; }
</style>
