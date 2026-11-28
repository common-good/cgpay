<script lang="ts">
  import { onMount } from 'svelte'
  import { settings, setSetting, type Settings } from './lib/settings'
  import { ownerOperated, selfServe, setSelfServe } from './lib/register'
  import type { Account } from './lib/accounts'

  // The app's settings, kept on the phone. co: the company account in use, when its manager may choose whether it is a cash register here (the owner-operated setting).
  let { co = null, onownerop }: { co?: Account | null, onownerop?: (on: boolean) => Promise<boolean> } = $props()
  let s = $state<Settings>(), own = $state(false), saving = $state(false), error = $state('')
  let self = $state(false)
  onMount(async () => { s = await settings(); if (co) { own = (await ownerOperated()).includes(co.uid); self = (await selfServe()).includes(co.uid) } })
  const LABELS: [keyof Settings, string][] = [['frontCamera', 'Use the front camera'], ['locked', 'Require sign-in to change account or settings']]

  // The box shows the setting only once the server agrees (turning the lock off needs it), so leaving at once cannot lose the change unseen.
  async function setOwn(box: HTMLInputElement) {
    const on = box.checked
    box.checked = own; error = ''; saving = true
    if (await onownerop?.(on)) own = on; else error = 'No connection. Connect to the internet to change this.'
    saving = false
  }
</script>

<h1>Settings</h1>
{#if s}
  {#each LABELS as [k, label]}
    <label class="check"><input type="checkbox" data-testid="set-{k}" checked={s[k]} onchange={e => setSetting(k, s![k] = e.currentTarget.checked)} /> {label}</label>
  {/each}
  {#if co}
    <label class="check"><input type="checkbox" data-testid="set-ownerOperated" checked={own} disabled={saving} onchange={e => setOwn(e.currentTarget)} /> Act as a personal account on this device (no cash register lock)</label>
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <label class="check"><input type="checkbox" data-testid="set-selfServe" checked={self} onchange={e => setSelfServe(co!.uid, self = e.currentTarget.checked)} /> Self-serve: customers scan their own card and pay on this device</label>
  {/if}
{/if}

<style>
  .check { display: flex; align-items: center; gap: 8px; padding: 12px 0; border-bottom: 1px solid #e4e8e4; }
  .err { color: #b3261e; }
</style>
