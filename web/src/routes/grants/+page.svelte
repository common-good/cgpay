<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import Icon from '$lib/components/Icon.svelte'

  type Grant = {
    id: number
    amount: number
    by: 'ach' | 'check' | 'wire'
    grantor: string
    documented: number | null
    received: number | null
    created: number
  }

  let loading = $state(true)
  let error = $state<string | null>(null)
  let forbidden = $state(false)
  let grants = $state<Grant[]>([])

  onMount(async () => {
    try {
      const res = await fetch('/api/grants')
      if (res.status === 401) {
        await goto('/login')
        return
      }
      if (res.status === 403) {
        forbidden = true
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        error = body.message ?? `Failed to load grants (${res.status})`
        return
      }
      const data = await res.json()
      grants = Array.isArray(data.grants) ? data.grants : []
    } catch {
      error = 'Network error - please try again.'
    } finally {
      loading = false
    }
  })

  function fmtAmount(n: number): string {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function fmtDate(unixSec: number | null): string {
    if (!unixSec) return '—'
    return new Date(unixSec * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function fmtBy(b: Grant['by']): string {
    return b === 'ach' ? 'ACH' : b === 'check' ? 'Check' : 'Wire'
  }

  function statusOf(g: Grant): { label: string; cls: string } {
    if (g.received) return { label: 'Received',   cls: 'pill-green' }
    if (g.documented) return { label: 'Documented', cls: 'pill-blue' }
    return { label: 'Pending', cls: 'pill-amber' }
  }
</script>

<main class="container">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Dashboard</a> <span aria-hidden="true">/</span> <span>Expected Grants</span></nav>

  <header class="head">
    <div class="page-head">
      <h1>Expected Grants</h1>
      <p>Grants you've reported to Common Good, and their current status.</p>
    </div>
    {#if !forbidden && grants.length}
      <a class="btn btn-primary" href="/grants/new"><Icon name="plus" size={18} /> Report Expected Grant</a>
    {/if}
  </header>

  {#if loading}
    <p class="muted">Loading...</p>
  {:else if forbidden}
    <div class="empty card">
      <h2>Expected Grants is for fiscally sponsored partners</h2>
      <p>Your account isn't currently marked as fiscally sponsored. If you believe that's wrong, please reach out to Common Good staff.</p>
      <a class="btn btn-secondary" href="/">Back to Dashboard</a>
    </div>
  {:else if error}
    <div class="alert alert-error" role="alert">{error}</div>
  {:else if grants.length === 0}
    <div class="empty card">
      <h2>No expected grants yet</h2>
      <p>When you have a donor sending funds, report it here so we can match and process it quickly.</p>
      <a class="btn btn-primary" href="/grants/new"><Icon name="plus" size={18} /> Report Your First Grant</a>
    </div>
  {:else}
    <div class="card table-wrap">
      <table>
        <thead>
          <tr><th>Grantor</th><th>Amount</th><th>Status</th><th>Method</th><th>Reported</th><th>Received</th></tr>
        </thead>
        <tbody>
          {#each grants as g}
            {@const s = statusOf(g)}
            <tr>
              <td class="grantor">{g.grantor || '-'}</td>
              <td class="amount">{fmtAmount(g.amount)}</td>
              <td class="status"><span class="pill {s.cls}">{s.label}</span></td>
              <td data-label="Method">{fmtBy(g.by)}</td>
              <td data-label="Reported">{fmtDate(g.created)}</td>
              <td data-label="Received">{fmtDate(g.received)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</main>

<style>
  .crumbs { font-size: var(--fs-sm); color: var(--cg-text-muted); margin-bottom: var(--sp-4); display: flex; gap: var(--sp-2); }
  .head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--sp-4); flex-wrap: wrap; margin-bottom: var(--sp-5); }
  .head .page-head { margin: 0; }

  .empty { display: grid; justify-items: center; gap: var(--sp-3); padding: var(--sp-7) var(--sp-5); text-align: center; }
  .empty h2 { font-size: var(--fs-lg); }
  .empty p { color: var(--cg-text-muted); max-width: 28rem; margin-bottom: var(--sp-2); }

  .table-wrap { overflow: hidden; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: var(--sp-3) var(--sp-4); text-align: left; font-size: var(--fs-sm); }
  th { background: var(--cg-surface-2); font-weight: 600; color: var(--cg-text-muted); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.04em; }
  tbody tr { border-top: 1px solid var(--cg-border); }
  .amount { font-variant-numeric: tabular-nums; font-weight: 600; }

  /* Phones: one stacked block per grant instead of a sideways-scrolling table. */
  @media (max-width: 639px) {
    .head .btn { width: 100%; }
    thead { display: none; }
    tbody tr { display: grid; grid-template-columns: 1fr auto; gap: var(--sp-1) var(--sp-3); padding: var(--sp-4); }
    td { padding: 0; }
    .grantor { font-weight: 600; font-size: var(--fs-base); }
    .amount { text-align: right; font-size: var(--fs-base); }
    .status { grid-column: 1 / -1; margin: var(--sp-1) 0; }
    td[data-label] { grid-column: 1 / -1; display: flex; justify-content: space-between; color: var(--cg-text-muted); }
    td[data-label]::before { content: attr(data-label); }
  }
</style>
