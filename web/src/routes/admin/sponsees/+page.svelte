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

  function pageHref(page: number): string {
    return '/admin/sponsees' + (page > 1 ? '?page=' + page : '')
  }
</script>

<h1>Sponsees</h1>
<p class="subtitle">Showing {start}-{end} of {data.total.toLocaleString('en-US')}</p>

{#if data.items.length === 0}
  <p class="empty">No fiscally sponsored partners yet.</p>
{:else}
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Sponsee</th>
          <th>EIN</th>
          <th class="num">Balance</th>
          <th class="num">Expected</th>
          <th class="num">Received</th>
          <th>Last activity</th>
        </tr>
      </thead>
      <tbody>
        {#each data.items as row (row.uid)}
          <tr>
            <td>
              <a class="sponsee-name" href={`/admin/sponsees/${row.uid}`}>{row.name}</a>
              {#if row.legalName && row.legalName !== row.name}
                <div class="sponsee-legal">{row.legalName}</div>
              {/if}
            </td>
            <td class="mono">{row.federalId || '-'}</td>
            <td class="num">{fmtMoney(row.balance)}</td>
            <td class="num">{fmtMoney(row.expectedGrantsTotal)}</td>
            <td class="num">{fmtMoney(row.receivedGrantsTotal)}</td>
            <td>{fmtDate(row.lastActivity)}</td>
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
    vertical-align: top;
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: rgba(0, 0, 0, 0.015); }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.88rem; }

  .sponsee-name { font-weight: 500; color: var(--cg-navy); text-decoration: none; }
  .sponsee-name:hover { text-decoration: underline; }
  .sponsee-legal { font-size: 0.8rem; color: var(--cg-text-muted); margin-top: 0.15rem; }

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
