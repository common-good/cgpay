<script lang="ts">
  import { onMount } from 'svelte'
  // A cash register in Manager Mode (a manager unlocked it): says so on every screen, counts down to the relock, and lets the manager end it at once.
  // Touches on the banner do not count as use (see the class name, which the idle timers skip).
  let { until, onexit, slim = false }: { until: number, onexit: () => void, slim?: boolean } = $props()
  let now = $state(Date.now())
  onMount(() => { const t = setInterval(() => now = Date.now(), 1000); return () => clearInterval(t) })
  $effect(() => { if (until) now = Date.now() }) // a touch restarts the countdown at once, not at the next tick
  const left = $derived(Math.max(0, Math.ceil((until - now) / 1000)))
</script>

<div class="manager-banner" class:slim data-testid="manager-mode">
  <span data-testid="manager-mode-label">Manager Mode</span>
  <button type="button" data-testid="btn-exit-manager" onclick={onexit}>Exit <small data-testid="manager-countdown">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</small></button>
</div>

<style>
  .manager-banner { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 16px; background: #0946a6; color: #fff; font-weight: 700; }
  .manager-banner.slim { padding: 4px 12px; font-size: 0.9rem; }
  button { padding: 6px 12px; border: 1px solid #fff; border-radius: 6px; background: transparent; color: #fff; font: inherit; cursor: pointer; }
  small { margin-left: 6px; font-weight: 400; font-size: 0.75em; font-variant-numeric: tabular-nums; }
</style>
