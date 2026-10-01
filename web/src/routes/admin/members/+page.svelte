<script lang="ts">
  let { data } = $props()

  const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)))
  const start = $derived(data.total === 0 ? 0 : data.offset + 1)
  const end = $derived(Math.min(data.offset + data.items.length, data.total))

  function fmtMoney(n: number): string {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function fmtDate(unixSec: number): string {
    if (!unixSec) return '-'
    return new Date(unixSec * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // flags bit layout from cgmembers/rcredits/defs.inc: B_OK=1, B_CO=2
  function statusLabel(flags: number): string {
    if ((flags & 1) === 0) return 'inactive'
    if ((flags & 2) !== 0) return 'company'
    return 'active'
  }

  function pageHref(page: number): string {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', String(page))
    if (data.q) params.set('q', data.q)
    const qs = params.toString()
    return '/admin/members' + (qs ? '?' + qs : '')
  }
</script>

<h1>Members</h1>
<p class="subtitle">Showing {start}-{end} of {data.total.toLocaleString('en-US')}</p>

<form class="filter" method="get" action="/admin/members">
  <input
    type="search"
    name="q"
    placeholder="Filter by name"
    value={data.q}
    aria-label="Filter by name"
  />
  <button type="submit">Filter</button>
  {#if data.q}<a class="clear" href="/admin/members">Clear</a>{/if}
</form>

{#if data.items.length === 0}
  <p class="empty">No members match this filter.</p>
{:else}
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Account</th>
          <th>Joined</th>
          <th class="num">Balance</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {#each data.items as row (row.uid)}
          <tr>
            <td>{row.name}</td>
            <td class="mono">{row.qid}</td>
            <td>{fmtDate(row.created)}</td>
            <td class="num">{fmtMoney(row.balance)}</td>
            <td><span class={'pill pill-' + statusLabel(row.flags)}>{statusLabel(row.flags)}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if totalPages > 1}
    <nav class="pager" aria-label="Pagination">
      {#if data.page > 1}
        <a href={pageHref(data.page - 1)}>&larr; Prev</a>
      {:else}
        <span class="disabled">&larr; Prev</span>
      {/if}
      <span class="pager-info">Page {data.page} of {totalPages}</span>
      {#if data.page < totalPages}
        <a href={pageHref(data.page + 1)}>Next &rarr;</a>
      {:else}
        <span class="disabled">Next &rarr;</span>
      {/if}
    </nav>
  {/if}
{/if}

<style>
  h1 {
    margin: 0 0 0.35rem;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--cg-text);
    letter-spacing: -0.01em;
  }
  .subtitle {
    margin: 0 0 1.25rem;
    color: var(--cg-text-muted);
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
  }

  .filter {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 1.25rem;
  }
  .filter input {
    flex: 0 1 280px;
    padding: 0.5rem 0.75rem;
    font-size: 0.92rem;
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    background: var(--cg-surface);
    color: var(--cg-text);
  }
  .filter input:focus {
    outline: none;
    border-color: var(--cg-green);
    box-shadow: 0 0 0 3px var(--cg-green-soft);
  }
  .filter button {
    padding: 0.5rem 1rem;
    background: var(--cg-navy);
    color: #fff;
    border: none;
    border-radius: var(--cg-radius-sm);
    font-weight: 600;
    cursor: pointer;
  }
  .filter .clear {
    color: var(--cg-text-muted);
    font-size: 0.85rem;
  }

  .empty {
    padding: 1.5rem;
    background: var(--cg-surface);
    border: 1px dashed var(--cg-border);
    border-radius: var(--cg-radius);
    color: var(--cg-text-muted);
  }

  .table-wrap {
    overflow-x: auto;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: var(--cg-shadow);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.92rem;
  }
  thead th {
    text-align: left;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid var(--cg-border);
    font-weight: 600;
    color: var(--cg-text-muted);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  tbody td {
    padding: 0.65rem 1rem;
    border-bottom: 1px solid var(--cg-border);
    color: var(--cg-text);
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: rgba(0, 0, 0, 0.015); }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.88rem; }

  .pill {
    display: inline-block;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .pill-active { background: rgba(30, 122, 58, 0.12); color: var(--cg-green); }
  .pill-inactive { background: rgba(0, 0, 0, 0.06); color: var(--cg-text-muted); }
  .pill-company { background: rgba(9, 70, 166, 0.1); color: var(--cg-navy); }

  .pager {
    margin-top: 1.25rem;
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
  }
  .pager a { color: var(--cg-navy); text-decoration: none; }
  .pager a:hover { text-decoration: underline; }
  .pager .disabled { color: var(--cg-text-muted); opacity: 0.5; }
  .pager-info { color: var(--cg-text-muted); font-variant-numeric: tabular-nums; }
</style>
