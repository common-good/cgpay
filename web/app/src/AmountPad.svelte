<script lang="ts">
  import { money } from './lib/tx'

  // Digits fill in from the cents end, as on a cash register: 1, 2, 5 gives 1.25.
  // A keyboard works too (digits, Backspace, Delete to clear, Enter to submit), except while typing in a text box.
  let { cents = $bindable(0), off = false }: { cents?: number, off?: boolean } = $props()
  const MAX = 9_999_999 // seven digits, enough to go past the online limit and be told so
  let pad: HTMLElement

  function press(k: string) {
    const n = cents * 10 + +k
    cents = k === 'c' ? 0 : k === 'b' ? Math.floor(cents / 10) : n > MAX ? cents : n
  }

  function onkeydown(e: KeyboardEvent) {
    const el = e.target as HTMLElement
    if (off || e.ctrlKey || e.metaKey || e.altKey || el.closest?.('input, textarea, select')) return
    if (e.key === 'Enter') { e.preventDefault(); pad.closest('form')?.requestSubmit(); return } // not a click on the pad key that has focus
    const k = /^\d$/.test(e.key) ? e.key : e.key === 'Backspace' ? 'b' : e.key === 'Delete' ? 'c' : ''
    if (k) { e.preventDefault(); press(k) }
  }
</script>

<svelte:window {onkeydown} />

<div class="pad" role="group" aria-label="Amount" bind:this={pad}>
  <output id="amount" aria-live="polite"><span class="cur">$</span><span data-testid="input-amount">{money(cents / 100)}</span></output>
  {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'c', '0', 'b'] as k}
    <button type="button" tabindex="-1" data-testid="pad-{k}" aria-label={k === 'c' ? 'Clear' : k === 'b' ? 'Backspace' : null} onclick={() => press(k)}>
      {#if k === 'c'}C{:else if k === 'b'}&#9003;{:else}{k}{/if}
    </button>
  {/each}
</div>

<style>
  .pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  output { grid-column: 1 / -1; text-align: right; font-size: 2rem; font-variant-numeric: tabular-nums; padding: 4px 8px; }
  .cur { margin-right: 2px; }
  button { min-height: 52px; font-size: 1.4rem; background: #eef2ef; color: inherit; border: 1px solid #c9d1cb; border-radius: 8px; }
  button:active { background: #dfe6e1; }
</style>
