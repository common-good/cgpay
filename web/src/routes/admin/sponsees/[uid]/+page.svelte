<script lang="ts">
  let { data } = $props()

  const isActive = $derived((data.sponsee.flags & 1) !== 0)

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

  function flagLabels(r: {
    owner: boolean
    employee: boolean
    customer: boolean
    autopay: boolean
    draw: boolean
  }): string[] {
    const out: string[] = []
    if (r.owner) out.push('owner')
    if (r.employee) out.push('employee')
    if (r.customer) out.push('customer')
    if (r.autopay) out.push('autopay')
    if (r.draw) out.push('draw')
    return out
  }
</script>

<nav class="crumbs" aria-label="Breadcrumb">
  <a href="/admin/sponsees">Sponsees</a>
  <span class="sep">/</span>
  <span>{data.sponsee.name}</span>
</nav>

<header class="profile">
  <div class="profile-main">
    <h1>{data.sponsee.name}</h1>
    <div class="profile-meta">
      <span class="mono qid">{data.sponsee.qid}</span>
      {#if isActive}
        <span class="pill pill-active">active</span>
      {:else}
        <span class="pill pill-inactive">inactive</span>
      {/if}
      <span class="pill pill-sponsee">sponsee</span>
    </div>
    {#if data.sponsee.legalName && data.sponsee.legalName !== data.sponsee.name}
      <div class="profile-legal">{data.sponsee.legalName}</div>
    {/if}
    {#if data.sponsee.federalId}
      <div class="profile-ein">
        <span class="label">EIN</span>
        <span class="mono">{data.sponsee.federalId}</span>
      </div>
    {/if}
  </div>
  <div class="profile-right">
    <div class="balance">
      <div class="balance-label">Balance</div>
      <div class="balance-value">{fmtMoney(data.sponsee.balance)}</div>
    </div>
  </div>
</header>

<section class="rollups" aria-label="Grants summary">
  <div class="rollup">
    <div class="rollup-label">Received grants</div>
    <div class="rollup-value">{fmtMoney(data.rollups.receivedTotal)}</div>
    <div class="rollup-sub">{data.rollups.receivedCount.toLocaleString('en-US')} grants</div>
  </div>
  <div class="rollup">
    <div class="rollup-label">Expected grants</div>
    <div class="rollup-value">{fmtMoney(data.rollups.expectedTotal)}</div>
    <div class="rollup-sub">{data.rollups.expectedCount.toLocaleString('en-US')} pending</div>
  </div>
  <div class="rollup">
    <div class="rollup-label">Linked members</div>
    <div class="rollup-value">{data.rollups.memberCount.toLocaleString('en-US')}</div>
    <div class="rollup-sub">authorized people</div>
  </div>
  <div class="rollup">
    <div class="rollup-label">Last activity</div>
    <div class="rollup-value small">{fmtDate(data.sponsee.lastActivity)}</div>
    <div class="rollup-sub">joined {fmtDate(data.sponsee.created)}</div>
  </div>
</section>

<section>
  <h2>Authorized members</h2>
  {#if data.relations.length === 0}
    <p class="empty">No one is authorized to transact on this sponsee's account yet.</p>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th>Permission</th>
            <th>Roles</th>
          </tr>
        </thead>
        <tbody>
          {#each data.relations as r (r.reid)}
            {@const roles = flagLabels(r)}
            <tr>
              <td>
                {#if r.uid}
                  <a href={`/admin/users/${r.uid}`}>{r.name}</a>
                {:else}
                  {r.name}
                {/if}
                {#if r.qid}
                  <div class="mono muted">{r.qid}</div>
                {/if}
              </td>
              <td>{r.permissionLabel}</td>
              <td>
                {#if roles.length === 0}
                  <span class="muted">-</span>
                {:else}
                  <div class="role-chips">
                    {#each roles as role (role)}
                      <span class="chip">{role}</span>
                    {/each}
                  </div>
                {/if}
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
    <p class="empty">No grants reported for this sponsee.</p>
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

<section>
  <h2>Recent transactions</h2>
  {#if data.txs.length === 0}
    <p class="empty">No transactions on this sponsee's account yet.</p>
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
  .profile-ein {
    margin-top: 0.35rem;
    display: inline-flex;
    gap: 0.5rem;
    align-items: baseline;
    font-size: 0.88rem;
  }
  .profile-ein .label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--cg-text-muted);
    font-weight: 600;
  }
  .profile-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }
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

  .rollups {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 0.75rem;
    margin-bottom: 2rem;
  }
  .rollup {
    padding: 0.85rem 1rem;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: var(--cg-shadow);
  }
  .rollup-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--cg-text-muted);
    font-weight: 600;
  }
  .rollup-value {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--cg-text);
    font-variant-numeric: tabular-nums;
    margin-top: 0.2rem;
  }
  .rollup-value.small { font-size: 1rem; font-weight: 600; }
  .rollup-sub {
    font-size: 0.78rem;
    color: var(--cg-text-muted);
    margin-top: 0.15rem;
  }

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
  tbody td a { color: var(--cg-navy); text-decoration: none; }
  tbody td a:hover { text-decoration: underline; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .num.received { color: var(--cg-green); font-weight: 600; }
  .num.paid { color: var(--cg-error); }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.86rem; }
  .mono.muted { color: var(--cg-text-muted); font-size: 0.78rem; margin-top: 0.15rem; }
  .muted { color: var(--cg-text-muted); }
  .desc { color: var(--cg-text-muted); max-width: 320px; }

  .role-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
  .chip {
    display: inline-block;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    background: rgba(9, 70, 166, 0.08);
    color: var(--cg-navy);
    font-size: 0.72rem;
    font-weight: 500;
  }

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
  .pill-sponsee  { background: rgba(9, 70, 166, 0.1);   color: var(--cg-navy); }
  .pill-pending     { background: rgba(0, 0, 0, 0.06);     color: var(--cg-text-muted); }
  .pill-documented  { background: rgba(9, 70, 166, 0.1);   color: var(--cg-navy); }
  .pill-received    { background: rgba(30, 122, 58, 0.12); color: var(--cg-green); }

  @media (max-width: 640px) {
    .profile { flex-direction: column; gap: 1rem; }
    .profile-right { align-items: stretch; width: 100%; }
    .balance { text-align: left; min-width: 0; width: 100%; }
  }
</style>
