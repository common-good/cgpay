<script lang="ts">
  import { onMount } from 'svelte'
  import { settings, setSetting, type Settings } from './lib/settings'

  // The app's settings, kept on the phone.
  let s = $state<Settings>()
  onMount(async () => { s = await settings() })
  const LABELS: [keyof Settings, string][] = [['frontCamera', 'Use the front camera'], ['locked', 'Require sign-in to change account or settings']]
</script>

<h1>Settings</h1>
{#if s}
  {#each LABELS as [k, label]}
    <label class="check"><input type="checkbox" data-testid="set-{k}" checked={s[k]} onchange={e => setSetting(k, s![k] = e.currentTarget.checked)} /> {label}</label>
  {/each}
{/if}

<style>
  .check { display: flex; align-items: center; gap: 8px; padding: 12px 0; border-bottom: 1px solid #e4e8e4; }
</style>
