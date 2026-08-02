<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { env } from '$env/dynamic/public'
  import Icon from '$lib/components/Icon.svelte'
  import type { InfoResponse, InfoTx } from './api/me/info/+server'

  let loading = $state(true)
  let error = $state<string | null>(null)
  let info = $state<InfoResponse | null>(null)

  type ModalKind = 'pay' | 'receive' | 'transfer' | 'soon' | null
  let modal = $state<ModalKind>(null)
  let soonAction = $state('')

  // Where the PHP member site lives. Menu items link to /<lowercased category> on this host.
  // Empty string = no PHP target configured; we render the menu as disabled.
  const phpBase = env.PUBLIC_PHP_BASE_URL ?? ''

  // PHP URLs for the primary dashboard actions + footer placeholders. Until the
  // action flows are rebuilt in SvelteKit, clicking lands the (already-signed-in)
  // member on the existing PHP page.
  function phpUrl(path: string): string {
    if (!phpBase) return ''
    return phpBase.replace(/\/$/, '') + path
  }

  onMount(async () => {
    const token = localStorage.getItem('cg_token')
    if (!token) {
      await goto('/login')
      return
    }
    try {
      const res = await fetch('/api/me/info?limit=20', {
        headers: { authorization: `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('cg_token')
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

  function pendingRequestsCount(i: InfoResponse): number {
    return i.txs.filter(t => t.pending).length
  }

  function firstName(fullName: string): string {
    return fullName.split(' ')[0]
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="page">
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
    <div class="hero">
      <div class="hero-inner">
        <h1>Welcome back, {firstName(info.name)}!</h1>
        <p>Here's what's happening with your account.</p>
      </div>
    </div>

    <main class="container">
      <section class="summary">
        <article class="card summary-card">
          <div class="icon-wrap tone-green"><Icon name="bank" size={20} /></div>
          <div class="card-body">
            <span class="s-label">Available Funds</span>
            <span class="s-value">{fmtMoney(info.balance)}</span>
          </div>
        </article>

        <article class="card summary-card">
          <div class="icon-wrap tone-blue"><Icon name="clock" size={20} /></div>
          <div class="card-body">
            <span class="s-label">Pending Deposits</span>
            <span class="s-value">{fmtMoney(info.summary.pendingTransferIn)}</span>
          </div>
        </article>

        <article class="card summary-card">
          <div class="icon-wrap tone-amber"><Icon name="clipboard" size={20} /></div>
          <div class="card-body">
            <span class="s-label">Pending Requests</span>
            <span class="s-value">{pendingRequestsCount(info)}</span>
          </div>
        </article>

        <article class="card summary-card muted">
          <div class="icon-wrap tone-purple"><Icon name="chat" size={20} /></div>
          <div class="card-body">
            <span class="s-label">Unread Messages</span>
            <span class="s-value">0</span>
            <span class="s-note">Coming soon</span>
          </div>
        </article>
      </section>

      <section class="actions">
        <article class="card action">
          <a class="action-btn" href={phpUrl('/tx/pay') || '#'} aria-disabled={!phpBase || undefined}>
            <div class="action-head">
              <div class="icon-wrap tone-rose"><Icon name="upload" size={20} /></div>
              <h2>Pay</h2>
            </div>
            <p class="action-desc">Send funds to another member.</p>
          </a>
          {#if info.summary.pendingPay > 0}
            <button type="button" class="pending-link" onclick={openPayPending}>
              Pending: {fmtMoney(info.summary.pendingPay)}
            </button>
          {/if}
        </article>

        <article class="card action">
          <a class="action-btn" href={phpUrl('/tx/charge') || '#'} aria-disabled={!phpBase || undefined}>
            <div class="action-head">
              <div class="icon-wrap tone-green"><Icon name="download" size={20} /></div>
              <h2>Receive</h2>
            </div>
            <p class="action-desc">Request funds from another member.</p>
          </a>
          {#if info.summary.pendingReceive > 0}
            <button type="button" class="pending-link" onclick={openReceivePending}>
              Pending: {fmtMoney(info.summary.pendingReceive)}
            </button>
          {/if}
        </article>

        <article class="card action">
          <a class="action-btn" href={phpUrl('/get') || '#'} aria-disabled={!phpBase || undefined}>
            <div class="action-head">
              <div class="icon-wrap tone-blue"><Icon name="bank" size={20} /></div>
              <h2>Transfer</h2>
            </div>
            <p class="action-desc">Move funds in or out of your account.</p>
          </a>
          {#if transferLabel(info)}
            <span class="pending-static">{transferLabel(info)}</span>
          {/if}
        </article>
      </section>

      <section class="quick-actions card">
        <h2>Quick Actions</h2>
        <ul>
          <li>
            <a href="/grants">
              <div class="qa-icon tone-green"><Icon name="plus" size={18} /></div>
              <div class="qa-body">
                <span class="qa-title">Expected Grants</span>
                <span class="qa-desc">View reported grants or notify us about incoming funding.</span>
              </div>
            </a>
          </li>
          <li>
            <a href={phpUrl('/settings') || '#'} aria-disabled={!phpBase || undefined}>
              <div class="qa-icon tone-blue"><Icon name="folder" size={18} /></div>
              <div class="qa-body">
                <span class="qa-title">Documents</span>
                <span class="qa-desc">Upload and manage your documents.</span>
              </div>
            </a>
          </li>
          <li>
            <a href={phpUrl('/community/message') || '#'} aria-disabled={!phpBase || undefined}>
              <div class="qa-icon tone-amber"><Icon name="chat" size={18} /></div>
              <div class="qa-body">
                <span class="qa-title">Messages</span>
                <span class="qa-desc">Message Common Good staff.</span>
              </div>
            </a>
          </li>
          <li>
            <a href={phpUrl('/settings') || '#'} aria-disabled={!phpBase || undefined}>
              <div class="qa-icon tone-purple"><Icon name="user" size={18} /></div>
              <div class="qa-body">
                <span class="qa-title">Profile & Settings</span>
                <span class="qa-desc">Update your account details.</span>
              </div>
            </a>
          </li>
        </ul>
      </section>

      <section class="bottom">
        <div class="recent card">
          <h2>Recent Actions</h2>
          {#if info.txs.filter(t => !t.pending).length === 0}
            <p class="empty">No activity yet.</p>
          {:else}
            <ul>
              {#each info.txs.filter(t => !t.pending) as tx (tx.xid)}
                <li>
                  <div class="icon-wrap {tx.amount >= 0 ? 'tone-green' : 'tone-rose'}">
                    <Icon name={tx.amount >= 0 ? 'download' : 'upload'} size={18} />
                  </div>
                  <span class="r-text">
                    {tx.amount >= 0 ? 'Received from' : 'Paid to'} {tx.counterparty}{tx.description ? ` — ${tx.description}` : ''}
                  </span>
                  <span class="r-pill pill-green">Completed</span>
                  <span class="r-date">{fmtDate(tx.created)}</span>
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        <aside class="help card">
          <h3>Need help?</h3>
          <p>Our team is here for you.</p>
          <a class="help-btn" href="mailto:support@commongood.earth">
            <Icon name="help" size={16} /> Contact Support
          </a>
        </aside>
      </section>
    </main>

    <footer class="footer">
      <ul class="footer-links">
        <li><a href={phpUrl('/community/donate') || '#'}>Donate</a></li>
        <li><a href={phpUrl('/community/invite') || '#'}>Invite Someone</a></li>
        <li><a href={phpUrl('/signup-co/relate=1') || '#'}>Open a Company Account</a></li>
        <li><a href={phpUrl('/prejoin') || '#'}>Make Joint Account</a></li>
        <li><a href="https://commongood.earth/about-us" target="_blank" rel="noopener">About Us</a></li>
        <li><a href={phpUrl('/community/agreement') || '#'}>The Agreement</a></li>
        <li><a href="https://commongood.earth/about-us/privacy-and-security" target="_blank" rel="noopener">Security</a></li>
        <li><a href={phpUrl('/help') || 'mailto:support@commongood.earth'}>Help</a></li>
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

  .hero {
    background:
      linear-gradient(to right, rgba(245,247,244,1) 0%, rgba(245,247,244,0.6) 60%, rgba(245,247,244,0) 100%),
      linear-gradient(180deg, #eaf1ea 0%, #f5f7f4 100%);
    padding: 2.5rem 0 3.5rem;
    border-bottom: 1px solid var(--cg-border);
  }
  .hero-inner { max-width: 1280px; margin: 0 auto; padding: 0 1.75rem; }
  .hero h1 { margin: 0 0 0.4rem; font-size: 2rem; font-weight: 600; letter-spacing: -0.01em; color: var(--cg-text); }
  .hero p { margin: 0; color: var(--cg-text-muted); }

  .container {
    flex: 1;
    max-width: 1280px; width: 100%; margin: -2rem auto 3rem;
    padding: 0 1.75rem;
    display: grid; gap: 1.5rem;
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }
  .summary-card {
    display: flex; gap: 1rem; padding: 1.25rem; align-items: flex-start;
  }
  .summary-card.muted { opacity: 0.75; }
  .summary-card .icon-wrap {
    flex-shrink: 0; width: 2.75rem; height: 2.75rem;
    border-radius: 50%; display: grid; place-items: center;
  }
  .card-body { display: grid; gap: 0.25rem; }
  .s-label { font-size: 0.85rem; color: var(--cg-text-muted); font-weight: 500; }
  .s-value { font-size: 1.4rem; font-weight: 700; color: var(--cg-text); letter-spacing: -0.01em; }
  .s-note { font-size: 0.75rem; color: var(--cg-text-muted); font-style: italic; margin-top: 0.15rem; }
  .tone-purple { background: rgba(120,80,180,0.1); color: #785ab4; }
  .tone-amber { background: rgba(214,143,30,0.12); color: #b96e0c; }

  .quick-actions { padding: 1.5rem; }
  .quick-actions h2 {
    margin: 0 0 1rem; font-size: 1rem; font-weight: 600; color: var(--cg-text);
  }
  .quick-actions ul {
    list-style: none; padding: 0; margin: 0;
    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }
  .quick-actions li a {
    display: flex; gap: 0.85rem; align-items: flex-start;
    padding: 1rem;
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    text-decoration: none; color: inherit;
    transition: border-color 0.15s, background 0.15s;
  }
  .quick-actions li a:hover { border-color: var(--cg-green); background: var(--cg-green-soft); }
  .quick-actions li a[aria-disabled="true"] { opacity: 0.55; cursor: not-allowed; pointer-events: none; }
  .qa-icon {
    flex-shrink: 0; width: 2.4rem; height: 2.4rem;
    border-radius: 50%; display: grid; place-items: center;
  }
  .qa-body { display: flex; flex-direction: column; gap: 0.15rem; }
  .qa-title { font-weight: 600; font-size: 0.9rem; color: var(--cg-text); }
  .qa-desc { font-size: 0.8rem; color: var(--cg-text-muted); line-height: 1.35; }

  .bottom {
    display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem;
  }
  @media (max-width: 900px) { .bottom { grid-template-columns: 1fr; } }

  .r-text { font-size: 0.9rem; color: var(--cg-text); }
  .r-date { font-size: 0.82rem; color: var(--cg-text-muted); }
  .r-pill { font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 999px; }
  .pill-green { background: rgba(30,122,58,0.12); color: var(--cg-green); }

  .recent li {
    grid-template-columns: auto 1fr auto auto !important;
  }

  .help {
    padding: 1.5rem;
    background: linear-gradient(180deg, #e9efe9 0%, #f0f4f0 100%);
  }
  .help h3 { margin: 0 0 0.4rem; font-size: 1rem; font-weight: 600; color: var(--cg-text); }
  .help p { margin: 0 0 1rem; color: var(--cg-text-muted); font-size: 0.9rem; }
  .help-btn {
    width: 100%;
    display: inline-flex; align-items: center; gap: 0.4rem; justify-content: center;
    padding: 0.65rem 1rem;
    background: var(--cg-surface); color: var(--cg-text);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    font-weight: 500;
    text-decoration: none;
    transition: border-color 0.15s;
  }
  .help-btn:hover { border-color: var(--cg-green); text-decoration: none; }

  .card {
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: var(--cg-shadow);
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
    text-decoration: none;
    border: none; padding: 1.25rem 1.25rem 1rem;
    cursor: pointer; display: flex; flex-direction: column; gap: 0.4rem;
    transition: background 0.15s;
  }
  .action-btn:hover { background: var(--cg-green-soft); text-decoration: none; }
  .action-btn[aria-disabled="true"] { opacity: 0.55; cursor: not-allowed; pointer-events: none; }
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
  .footer-links a { color: var(--cg-text-muted); }
  .footer-links a:hover { color: var(--cg-green); }
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
