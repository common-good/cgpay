<script lang="ts">
  import { onMount } from 'svelte'
  import { settings, setSetting, type Settings } from './lib/settings'
  import { ownerOperated } from './lib/register'
  import type { Account } from './lib/accounts'

  // The app's settings, kept on the phone. co: the company account in use, when its manager may choose whether it is a cash register here (the owner-operated setting).
  let { co = null, onownerop }: { co?: Account | null, onownerop?: (on: boolean) => Promise<boolean> } = $props()
  let s = $state<Settings>(), own = $state(false), error = $state('')
  onMount(async () => { s = await settings(); if (co) own = (await ownerOperated()).includes(co.uid) })
  const LABELS: [keyof Settings, string][] = [['frontCamera', 'Use the front camera'], ['locked', 'Require sign-in to change account or settings']]

  async function setOwn(on: boolean) {
    error = ''
    if (await onownerop?.(on)) own = on; else { own = !on; error = 'No connection. Connect to the internet to change this.' }
  }
</script>

<h1>Settings</h1>
{#if s}
  {#each LABELS as [k, label]}
    <label class="check"><input type="checkbox" data-testid="set-{k}" checked={s[k]} onchange={e => setSetting(k, s![k] = e.currentTarget.checked)} /> {label}</label>
  {/each}
  {#if co}
    <label class="check"><input type="checkbox" data-testid="set-ownerOperated" checked={own} onchange={e => setOwn(e.currentTarget.checked)} /> Act as a personal account on this device (no cash register lock)</label>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
  {/if}
{/if}

<style>
  .check { display: flex; align-items: center; gap: 8px; padding: 12px 0; border-bottom: 1px solid #e4e8e4; }
  .err { color: #b3261e; }
</style>
