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
    const token = localStorage.getItem('cg_token')
    if (!token) {
      await goto('/login')
      return
    }
    try {
      const res = await fetch('/api/grants', {
        headers: { authorization: `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('cg_token')
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
      error = 'Network error — please try again.'
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

<div class="container">
  <nav class="crumbs">
    <a href="/">Dashboard</a> <span>›</span> <span>Expected Grants</span>
  </nav>

  <header>
    <div>
      <h1>Expected Grants</h1>
      <p>Grants you've reported to Common Good, and their current status.</p>
    </div>
    <div class="header-actions">
      <a class="primary" href="/grants/new"><Icon name="plus" size={16} /> Report Expected Grant</a>
    </div>
  </header>

  {#if loading}
    <div class="notice">Loading…</div>
  {:else if forbidden}
    <div class="empty card">
      <h3>Expected Grants is for fiscally sponsored partners</h3>
      <p>Your account isn't currently marked as fiscally sponsored. If you believe that's wrong, please reach out to Common Good staff.</p>
      <a class="primary" href="/">← Back to Dashboard</a>
    </div>
  {:else if error}
    <div class="notice err" role="alert">{error}</div>
  {:else if grants.length === 0}
    <div class="empty card">
      <h3>No expected grants yet</h3>
      <p>When you have a donor sending funds, report it here so we can match and process it quickly.</p>
      <a class="primary" href="/grants/new"><Icon name="plus" size={16} /> Report Your First Grant</a>
    </div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Grantor</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Reported</th>
            <th>Received</th>
          </tr>
        </thead>
        <tbody>
          {#each grants as g}
            {@const s = statusOf(g)}
            <tr>
              <td><span class="pill {s.cls}">{s.label}</span></td>
              <td>{g.grantor || '—'}</td>
              <td>{fmtAmount(g.amount)}</td>
              <td>{fmtBy(g.by)}</td>
              <td>{fmtDate(g.created)}</td>
              <td>{fmtDate(g.received)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .container { max-width: 1280px; margin: 0 auto; padding: 1.5rem 1.75rem 3rem; }
  .crumbs { font-size: 0.85rem; color: var(--cg-text-muted); margin-bottom: 1rem; }
  .crumbs a { color: var(--cg-green); }
  .crumbs span { margin: 0 0.5rem; }

  header { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 1.5rem; }
  header h1 { margin: 0 0 0.2rem; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.01em; }
  header p { margin: 0; color: var(--cg-text-muted); font-size: 0.9rem; }

  .header-actions { display: flex; gap: 0.5rem; }
  .primary {
    padding: 0.55rem 1.05rem; background: var(--cg-green); color: white; border: 0;
    border-radius: var(--cg-radius-sm); font-size: 0.9rem; font-weight: 500; cursor: pointer;
    text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem;
  }

  .notice { padding: 1rem 1.2rem; color: var(--cg-text-muted); }
  .notice.err {
    background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;
    border-radius: var(--cg-radius-sm);
  }

  .empty {
    padding: 2.5rem 2rem; text-align: center; background: var(--cg-surface);
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius);
  }
  .empty h3 { margin: 0 0 0.4rem; font-size: 1.1rem; }
  .empty p { margin: 0 0 1.2rem; color: var(--cg-text-muted); font-size: 0.9rem; }

  .table-wrap {
    background: var(--cg-surface); border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius); overflow: hidden;
  }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.75rem 1rem; text-align: left; font-size: 0.9rem; }
  th { background: var(--cg-bg); font-weight: 600; color: var(--cg-text); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.04em; }
  tbody tr { border-top: 1px solid var(--cg-border); }
  tbody tr:hover { background: var(--cg-bg); }

  .pill {
    display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px;
    font-size: 0.78rem; font-weight: 600;
  }
  .pill-green { background: #dcfce7; color: #166534; }
  .pill-blue  { background: #dbeafe; color: #1e40af; }
  .pill-amber { background: #fef3c7; color: #92400e; }
</style>
