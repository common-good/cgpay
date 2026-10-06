<script lang="ts">
  let { data } = $props()

  function fmtMoney(n: number): string {
    return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function fmtDate(unixSec: number | null): string {
    if (!unixSec) return '-'
    return new Date(unixSec * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const grantStatus = (g: { received: number | null; documented: number | null }): string => {
    if (g.received) return 'received'
    if (g.documented) return 'documented'
    return 'pending'
  }

  const statusPill = $derived(() => {
    if ((data.user.flags & 1) === 0) return { label: 'inactive', cls: 'pill-inactive' }
    if (data.user.admin) return { label: 'admin', cls: 'pill-admin' }
    if (data.user.sponsored) return { label: 'sponsee', cls: 'pill-company' }
    if (data.user.co) return { label: 'company', cls: 'pill-company' }
    return { label: 'active', cls: 'pill-active' }
  })
</script>

<nav class="crumbs" aria-label="Breadcrumb">
  <a href="/admin/members">Members</a>
  <span class="sep">/</span>
  <span>{data.user.name}</span>
</nav>

<header class="profile">
  <div class="profile-main">
    <h1>{data.user.name}</h1>
    <div class="profile-meta">
      <span class="mono qid">{data.user.qid}</span>
      <span class={'pill ' + statusPill().cls}>{statusPill().label}</span>
    </div>
    {#if data.user.fullName && data.user.fullName !== data.user.name}
      <div class="profile-legal">{data.user.fullName}</div>
    {/if}
  </div>
  <div class="balance">
    <div class="balance-label">Balance</div>
    <div class="balance-value">{fmtMoney(data.user.balance)}</div>
  </div>
</header>

<section class="contact-grid">
  <div><dt>Login</dt><dd class="mono">{data.user.loginName || '-'}</dd></div>
  <div><dt>Email</dt><dd>{data.user.email || '-'}</dd></div>
  <div><dt>Phone</dt><dd>{data.user.phone || '-'}</dd></div>
  <div><dt>Joined</dt><dd>{fmtDate(data.user.created)}</dd></div>
</section>

<section>
  <h2>Recent transactions</h2>
  {#if data.txs.length === 0}
    <p class="empty">No transactions yet.</p>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Counterparty</th>
            <th>Description</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {#each data.txs as tx (tx.xid)}
            <tr>
              <td>{fmtDate(tx.created)}</td>
              <td>{tx.counterparty}</td>
              <td class="desc">{tx.description || '-'}</td>
              <td class="num" class:received={tx.amount >= 0} class:paid={tx.amount < 0}>
                {fmtMoney(tx.amount)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<section>
  <h2>Grants</h2>
  {#if data.grants.length === 0}
    <p class="empty">No grants reported for this account.</p>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Grantor</th>
            <th>Method</th>
            <th class="num">Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each data.grants as g (g.id)}
            <tr>
              <td>{fmtDate(g.created)}</td>
              <td>{g.grantor || '-'}</td>
              <td class="mono">{g.by || '-'}</td>
              <td class="num">{fmtMoney(g.amount)}</td>
              <td><span class={'pill pill-' + grantStatus(g)}>{grantStatus(g)}</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<style>
  .crumbs {
    font-size: 0.85rem;
    color: var(--cg-text-muted);
    margin-bottom: 0.75rem;
  }
  .crumbs a { color: var(--cg-navy); text-decoration: none; }
  .crumbs a:hover { text-decoration: underline; }
  .crumbs .sep { margin: 0 0.4rem; opacity: 0.5; }

  .profile {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem;
    margin-bottom: 1.5rem;
  }
  .profile-main { flex: 1; min-width: 0; }
  h1 {
    margin: 0 0 0.4rem;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--cg-text);
    letter-spacing: -0.01em;
  }
  .profile-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .qid { color: var(--cg-text-muted); font-size: 0.95rem; letter-spacing: 0.06em; }
  .profile-legal { margin-top: 0.35rem; color: var(--cg-text-muted); font-size: 0.88rem; }
  .balance {
    text-align: right;
    padding: 0.5rem 1rem;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: var(--cg-shadow);
    min-width: 160px;
  }
  .balance-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--cg-text-muted);
    font-weight: 600;
  }
  .balance-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--cg-text);
    font-variant-numeric: tabular-nums;
    margin-top: 0.2rem;
  }

  .contact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem 1.5rem;
    margin-bottom: 2rem;
    padding: 1rem 1.25rem;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
  }
  .contact-grid dt {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--cg-text-muted);
    font-weight: 600;
    margin: 0;
  }
  .contact-grid dd { margin: 0.15rem 0 0; color: var(--cg-text); font-size: 0.92rem; word-break: break-word; }

  section { margin-bottom: 2rem; }
  h2 {
    margin: 0 0 0.75rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--cg-text);
  }

  .empty {
    padding: 1rem 1.25rem;
    background: var(--cg-surface);
    border: 1px dashed var(--cg-border);
    border-radius: var(--cg-radius);
    color: var(--cg-text-muted);
    margin: 0;
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
    font-size: 0.9rem;
  }
  thead th {
    text-align: left;
    padding: 0.65rem 0.9rem;
    background: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid var(--cg-border);
    font-weight: 600;
    color: var(--cg-text-muted);
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  tbody td { padding: 0.55rem 0.9rem; border-bottom: 1px solid var(--cg-border); color: var(--cg-text); vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: rgba(0, 0, 0, 0.015); }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .num.received { color: var(--cg-green); font-weight: 600; }
  .num.paid { color: var(--cg-error); }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.86rem; }
  .desc { color: var(--cg-text-muted); max-width: 320px; }

  .pill {
    display: inline-block;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .pill-active   { background: rgba(30, 122, 58, 0.12); color: var(--cg-green); }
  .pill-inactive { background: rgba(0, 0, 0, 0.06);     color: var(--cg-text-muted); }
  .pill-company  { background: rgba(9, 70, 166, 0.1);   color: var(--cg-navy); }
  .pill-admin    { background: rgba(179, 38, 30, 0.1);  color: var(--cg-error); }
  .pill-pending     { background: rgba(0, 0, 0, 0.06);     color: var(--cg-text-muted); }
  .pill-documented  { background: rgba(9, 70, 166, 0.1);   color: var(--cg-navy); }
  .pill-received    { background: rgba(30, 122, 58, 0.12); color: var(--cg-green); }

  @media (max-width: 640px) {
    .profile { flex-direction: column; gap: 1rem; }
    .balance { text-align: left; min-width: 0; width: 100%; }
  }
</style>
