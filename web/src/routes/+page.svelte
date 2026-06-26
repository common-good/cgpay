<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { env } from '$env/dynamic/public'
  import Brand from '$lib/components/Brand.svelte'
  import Icon from '$lib/components/Icon.svelte'
  import type { InfoResponse, InfoTx } from './api/me/info/+server'

  let loading = $state(true)
  let error = $state<string | null>(null)
  let info = $state<InfoResponse | null>(null)
  let menu = $state<string[]>(['Dashboard', 'History', 'Community', 'Settings'])

  type ModalKind = 'pay' | 'receive' | 'transfer' | 'soon' | null
  let modal = $state<ModalKind>(null)
  let soonAction = $state('')

  // Where the PHP member site lives. Menu items link to /<lowercased category> on this host.
  // Empty string = no PHP target configured; we render the menu as disabled.
  const phpBase = env.PUBLIC_PHP_BASE_URL ?? ''

  // PHP top-level routes don't always match the menu label verbatim — these are
  // the ones that diverge (Company → /co, Admin → /sadmin per cg-menu.inc).
  const PHP_PATH: Record<string, string> = {
    Dashboard: '/dashboard',
    History: '/history',
    Community: '/community',
    Settings: '/settings',
    Company: '/co',
    Admin: '/sadmin'
  }

  function menuHref(label: string): string {
    if (!phpBase) return ''
    return phpBase.replace(/\/$/, '') + (PHP_PATH[label] ?? `/${label.toLowerCase()}`)
  }

  onMount(async () => {
    const token = localStorage.getItem('cg_token')
    if (!token) {
      await goto('/login')
      return
    }
    const storedMenu = localStorage.getItem('cg_menu')
    if (storedMenu) {
      try {
        const parsed = JSON.parse(storedMenu)
        if (Array.isArray(parsed) && parsed.every(s => typeof s === 'string')) menu = parsed
      } catch { /* ignore — fall back to default */ }
    }
    try {
      const res = await fetch('/api/me/info?limit=20', {
        headers: { authorization: `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('cg_token')
        localStorage.removeItem('cg_menu')
        await goto('/login')
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        error = body.message ?? `Failed to load dashboard (${res.status})`
        return
      }
      info = await res.json()
    } catch {
      error = 'Network error — please try again.'
    } finally {
      loading = false
    }
  })

  function signOut() {
    localStorage.removeItem('cg_token')
    localStorage.removeItem('cg_menu')
    goto('/login')
  }

  function fmtMoney(n: number) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function fmtDate(unixSec: number) {
    return new Date(unixSec * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  function payPendingItems(i: InfoResponse): InfoTx[] {
    return i.txs.filter(t => t.pending && t.amount < 0)
  }
  function receivePendingItems(i: InfoResponse): InfoTx[] {
    return i.txs.filter(t => t.pending && t.amount > 0)
  }

  function openPayPending() { modal = 'pay' }
  function openReceivePending() { modal = 'receive' }
  function openSoon(action: string) {
    soonAction = action
    modal = 'soon'
  }
  function closeModal() { modal = null }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && modal) closeModal()
  }

  function transferLabel(i: InfoResponse): string {
    const { pendingTransferIn: inAmt, pendingTransferOut: outAmt } = i.summary
    if (inAmt === 0 && outAmt === 0) return ''
    if (inAmt > 0 && outAmt === 0) return `Pending: ${fmtMoney(inAmt)} in`
    if (outAmt > 0 && inAmt === 0) return `Pending: ${fmtMoney(outAmt)} out`
    return `Pending: ${fmtMoney(inAmt)} in / ${fmtMoney(outAmt)} out`
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="page">
  <nav class="topnav">
    <Brand size={32} />
    <ul class="nav-links">
      {#each menu as label}
        {#if label === 'Dashboard'}
          <li><a class="active" href="/">Dashboard</a></li>
        {:else if menuHref(label)}
          <li><a href={menuHref(label)}>{label}</a></li>
        {:else}
          <li><button type="button" class="nav-disabled" title="Member site link not configured">{label}</button></li>
        {/if}
      {/each}
    </ul>
    {#if info}
      <div class="account">
        <span class="hi">Hi, {info.name}</span>
        <button class="ghost" onclick={signOut}>Sign out</button>
      </div>
    {/if}
  </nav>

  {#if loading}
    <main class="centered"><p class="state">Loading…</p></main>
  {:else if error}
    <main class="centered">
      <div class="error-card" role="alert">
        <strong>Something went wrong</strong>
        <span>{error}</span>
      </div>
    </main>
  {:else if info}
    <main class="container">
      <section class="balance card">
        <span class="balance-label">Available Balance</span>
        <span class="balance-amount">{fmtMoney(info.balance)}</span>
      </section>

      <section class="actions">
        <article class="card action">
          <button type="button" class="action-btn" onclick={() => openSoon('Pay')}>
            <div class="action-head">
              <div class="icon-wrap tone-rose"><Icon name="upload" size={20} /></div>
              <h2>Pay</h2>
            </div>
            <p class="action-desc">Send funds to another member.</p>
          </button>
          {#if info.summary.pendingPay > 0}
            <button type="button" class="pending-link" onclick={openPayPending}>
              Pending: {fmtMoney(info.summary.pendingPay)}
            </button>
          {/if}
        </article>

        <article class="card action">
          <button type="button" class="action-btn" onclick={() => openSoon('Receive')}>
            <div class="action-head">
              <div class="icon-wrap tone-green"><Icon name="download" size={20} /></div>
              <h2>Receive</h2>
            </div>
            <p class="action-desc">Request funds from another member.</p>
          </button>
          {#if info.summary.pendingReceive > 0}
            <button type="button" class="pending-link" onclick={openReceivePending}>
              Pending: {fmtMoney(info.summary.pendingReceive)}
            </button>
          {/if}
        </article>

        <article class="card action">
          <button type="button" class="action-btn" onclick={() => openSoon('Transfer')}>
            <div class="action-head">
              <div class="icon-wrap tone-blue"><Icon name="bank" size={20} /></div>
              <h2>Transfer</h2>
            </div>
            <p class="action-desc">Move funds in or out of your account.</p>
          </button>
          {#if transferLabel(info)}
            <span class="pending-static">{transferLabel(info)}</span>
          {/if}
        </article>
      </section>

      <section class="recent card">
        <h2>Recent Activity</h2>
        {#if info.txs.filter(t => !t.pending).length === 0}
          <p class="empty">No transactions yet.</p>
        {:else}
          <ul>
            {#each info.txs.filter(t => !t.pending) as tx (tx.xid)}
              <li>
                <div class="icon-wrap tx-icon {tx.amount >= 0 ? 'tone-green' : 'tone-rose'}">
                  <Icon name={tx.amount >= 0 ? 'download' : 'upload'} size={18} />
                </div>
                <span class="text">
                  {tx.amount >= 0 ? 'Received from' : 'Paid to'} {tx.counterparty}{tx.description ? ` — ${tx.description}` : ''}
                </span>
                <span class="amount" class:negative={tx.amount < 0}>{fmtMoney(tx.amount)}</span>
                <span class="date">{fmtDate(tx.created)}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </main>

    <footer class="footer">
      <ul class="footer-links">
        <li><button type="button" class="footer-disabled" title="Coming soon">Donate</button></li>
        <li><button type="button" class="footer-disabled" title="Coming soon">Invite Someone</button></li>
        <li><a href="https://commongood.earth/about-us" target="_blank" rel="noopener">About Us</a></li>
        <li><button type="button" class="footer-disabled" title="Coming soon">The Agreement</button></li>
        <li><a href="https://commongood.earth/about-us/privacy-and-security" target="_blank" rel="noopener">Security</a></li>
        <li><a href="mailto:support@commongood.earth">Help</a></li>
      </ul>
      <p class="copyright">copyright &copy; {new Date().getFullYear()} Common Good&reg;, a nonprofit organization</p>
    </footer>
  {/if}

  {#if modal}
    <button class="modal-backdrop" type="button" onclick={closeModal} aria-label="Close dialog"></button>
    <div class="modal card" role="dialog" aria-labelledby="modal-title" aria-modal="true" tabindex="-1">
      {#if modal === 'soon'}
        <h3 id="modal-title">{soonAction} — coming soon</h3>
        <p>This action will go live in the next phase of the Common Good member rebuild.</p>
        <button class="primary-btn" onclick={closeModal}>Got it</button>
      {:else if modal === 'pay' && info}
        <h3 id="modal-title">Pending payments</h3>
        <p class="modal-sub">Invoices waiting on you.</p>
        <ul class="modal-list">
          {#each payPendingItems(info) as tx}
            <li>
              <div class="modal-row">
                <span class="modal-cp">{tx.counterparty}</span>
                <span class="modal-amt">{fmtMoney(Math.abs(tx.amount))}</span>
              </div>
              {#if tx.description}
                <span class="modal-desc">{tx.description}</span>
              {/if}
              <span class="modal-date">{fmtDate(tx.created)}</span>
            </li>
          {/each}
        </ul>
        <button class="primary-btn" onclick={closeModal}>Close</button>
      {:else if modal === 'receive' && info}
        <h3 id="modal-title">Pending receivables</h3>
        <p class="modal-sub">Invoices you're waiting on.</p>
        <ul class="modal-list">
          {#each receivePendingItems(info) as tx}
            <li>
              <div class="modal-row">
                <span class="modal-cp">{tx.counterparty}</span>
                <span class="modal-amt receive">{fmtMoney(tx.amount)}</span>
              </div>
              {#if tx.description}
                <span class="modal-desc">{tx.description}</span>
              {/if}
              <span class="modal-date">{fmtDate(tx.created)}</span>
            </li>
          {/each}
        </ul>
        <button class="primary-btn" onclick={closeModal}>Close</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .page { min-height: 100vh; display: flex; flex-direction: column; }

  .topnav {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 0.85rem 1.75rem;
    background: var(--cg-surface);
    border-bottom: 1px solid var(--cg-border);
  }
  .nav-links {
    list-style: none; padding: 0; margin: 0;
    display: flex; gap: 1.5rem; flex: 1;
  }
  .nav-links a {
    color: var(--cg-text-muted);
    font-size: 0.92rem;
    font-weight: 500;
    padding: 0.4rem 0.1rem;
    border-bottom: 2px solid transparent;
  }
  .nav-links a:hover { color: var(--cg-text); text-decoration: none; }
  .nav-links a.active { color: var(--cg-text); border-bottom-color: var(--cg-green); }
  .nav-disabled {
    background: transparent;
    border: none;
    padding: 0.4rem 0.1rem;
    color: var(--cg-text-muted);
    font-size: 0.92rem;
    font-weight: 500;
    opacity: 0.55;
    cursor: not-allowed;
    font-family: inherit;
  }

  .account { display: flex; align-items: center; gap: 1rem; }
  .hi { color: var(--cg-text); font-size: 0.95rem; }
  .ghost {
    padding: 0.45rem 0.85rem;
    background: transparent; color: var(--cg-text);
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    font-size: 0.9rem; cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .ghost:hover { background: var(--cg-green-soft); border-color: var(--cg-green); }

  .centered { flex: 1; display: grid; place-items: center; padding: 2rem 1.5rem; }
  .state { color: var(--cg-text-muted); }
  .error-card {
    max-width: 400px; display: grid; gap: 0.4rem;
    padding: 1.25rem 1.5rem;
    background: var(--cg-surface);
    border: 1px solid var(--cg-border); border-left: 3px solid var(--cg-error);
    border-radius: var(--cg-radius-sm); color: var(--cg-text);
  }
  .error-card strong { color: var(--cg-error); }
  .error-card span { color: var(--cg-text-muted); font-size: 0.9rem; }

  .container {
    flex: 1;
    max-width: 1080px; width: 100%; margin: 0 auto;
    padding: 2rem 1.75rem 3rem;
    display: grid; gap: 1.5rem;
  }

  .card {
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: var(--cg-shadow);
  }

  .balance {
    padding: 1.75rem 2rem;
    display: flex; flex-direction: column; gap: 0.3rem;
    align-items: flex-start;
  }
  .balance-label {
    font-size: 0.78rem; color: var(--cg-text-muted);
    text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;
  }
  .balance-amount {
    font-size: 2.4rem; font-weight: 700; letter-spacing: -0.02em;
    color: var(--cg-text);
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  @media (max-width: 560px) {
    .actions { gap: 0.5rem; }
    .action-btn { padding: 0.85rem 0.75rem 0.6rem !important; }
    .action h2 { font-size: 1rem !important; }
    .action-desc { font-size: 0.78rem !important; }
    .pending-link, .pending-static { padding: 0.55rem 0.75rem !important; font-size: 0.78rem !important; }
  }
  .action {
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .action-btn {
    text-align: left; width: 100%;
    background: var(--cg-surface); color: inherit;
    border: none; padding: 1.25rem 1.25rem 1rem;
    cursor: pointer; display: flex; flex-direction: column; gap: 0.4rem;
    transition: background 0.15s;
  }
  .action-btn:hover { background: var(--cg-green-soft); }
  .action-head { display: flex; align-items: center; gap: 0.75rem; }
  .action h2 { margin: 0; font-size: 1.15rem; font-weight: 600; }
  .action-desc { margin: 0; color: var(--cg-text-muted); font-size: 0.88rem; line-height: 1.4; }

  .icon-wrap {
    flex-shrink: 0; width: 2.4rem; height: 2.4rem;
    border-radius: 50%; display: grid; place-items: center;
  }
  .tone-green { background: rgba(30,122,58,0.1); color: var(--cg-green); }
  .tone-rose  { background: rgba(185,76,102,0.12); color: #b94c66; }
  .tone-blue  { background: rgba(45,108,189,0.10); color: #2d6cbd; }

  .pending-link, .pending-static {
    border-top: 1px solid var(--cg-border);
    padding: 0.75rem 1.25rem;
    font-size: 0.88rem;
    font-weight: 600;
    text-align: left;
    background: transparent;
  }
  .pending-link {
    color: var(--cg-green);
    border-left: none; border-right: none; border-bottom: none;
    cursor: pointer;
    transition: background 0.15s;
  }
  .pending-link:hover { background: var(--cg-green-soft); text-decoration: underline; }
  .pending-static { color: var(--cg-text-muted); }

  .recent { padding: 1.5rem; }
  .recent h2 { margin: 0 0 1rem; font-size: 1rem; font-weight: 600; }
  .empty { color: var(--cg-text-muted); margin: 0; }
  .recent ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
  .recent li {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 0.85rem; align-items: center;
    padding: 0.7rem 0.85rem;
    border-radius: var(--cg-radius-sm);
  }
  .recent li:hover { background: var(--cg-bg); }
  .text { font-size: 0.9rem; color: var(--cg-text); }
  .date { font-size: 0.82rem; color: var(--cg-text-muted); }
  .amount { font-size: 0.9rem; font-weight: 600; color: var(--cg-green); }
  .amount.negative { color: var(--cg-text); }

  .footer {
    border-top: 1px solid var(--cg-border);
    background: var(--cg-surface);
    padding: 1.5rem 1.75rem;
    text-align: center;
  }
  .footer-links {
    list-style: none; padding: 0; margin: 0 0 0.75rem;
    display: flex; flex-wrap: wrap; justify-content: center;
    gap: 0.4rem 0.85rem;
    font-size: 0.88rem;
  }
  .footer-links a, .footer-disabled { color: var(--cg-text-muted); }
  .footer-links a:hover { color: var(--cg-green); }
  .footer-disabled {
    background: transparent;
    border: none;
    padding: 0;
    font-size: inherit;
    font-family: inherit;
    opacity: 0.55;
    cursor: not-allowed;
  }
  .footer-links li:not(:last-child)::after {
    content: '|';
    color: var(--cg-border);
    margin-left: 0.85rem;
  }
  .copyright {
    margin: 0; font-size: 0.8rem; color: var(--cg-text-muted);
  }

  .modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(26, 31, 28, 0.4);
    border: none; padding: 0; cursor: pointer;
    z-index: 100;
  }
  .modal {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    max-width: 460px; width: calc(100% - 2rem);
    padding: 1.5rem;
    background: var(--cg-surface);
    z-index: 101;
    max-height: 80vh;
    overflow-y: auto;
  }
  .modal h3 { margin: 0 0 0.4rem; font-size: 1.15rem; font-weight: 600; }
  .modal p { margin: 0 0 1rem; color: var(--cg-text-muted); font-size: 0.9rem; }
  .modal-sub { margin-bottom: 0.75rem; }
  .modal-list { list-style: none; padding: 0; margin: 0 0 1.25rem; display: grid; gap: 0.6rem; }
  .modal-list li {
    padding: 0.7rem 0.85rem;
    background: var(--cg-bg);
    border-radius: var(--cg-radius-sm);
    display: grid; gap: 0.2rem;
  }
  .modal-row { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
  .modal-cp { font-weight: 600; font-size: 0.92rem; color: var(--cg-text); }
  .modal-amt { font-weight: 700; font-size: 0.95rem; color: var(--cg-text); }
  .modal-amt.receive { color: var(--cg-green); }
  .modal-desc { font-size: 0.85rem; color: var(--cg-text-muted); }
  .modal-date { font-size: 0.78rem; color: var(--cg-text-muted); }
  .primary-btn {
    width: 100%;
    display: inline-flex; align-items: center; gap: 0.4rem; justify-content: center;
    padding: 0.65rem 1rem;
    background: var(--cg-surface); color: var(--cg-text);
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    cursor: pointer; font-weight: 500;
  }
  .primary-btn:hover { border-color: var(--cg-green); }
</style>
