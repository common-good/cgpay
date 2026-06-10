<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import Icon from '$lib/components/Icon.svelte'
  import type { InfoResponse, InfoTx } from './api/me/info/+server'

  let loading = $state(true)
  let error = $state<string | null>(null)
  let info = $state<InfoResponse | null>(null)
  let showSoon = $state(false)
  let soonAction = $state('')

  onMount(async () => {
    const token = localStorage.getItem('cg_token')
    if (!token) {
      await goto('/login')
      return
    }
    try {
      const res = await fetch('/api/me/info?limit=8', {
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

  function signOut() {
    localStorage.removeItem('cg_token')
    goto('/login')
  }

  function fmtMoney(n: number) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function fmtDate(unixSec: number) {
    const d = new Date(unixSec * 1000)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function txIcon(tx: InfoTx): string {
    if (tx.pending) return 'clock'
    return tx.amount >= 0 ? 'download' : 'upload'
  }

  function txDescription(tx: InfoTx): string {
    const verb = tx.amount >= 0 ? 'Received from' : 'Paid to'
    const detail = tx.description ? ` — ${tx.description}` : ''
    return `${verb} ${tx.counterparty}${detail}`
  }

  function comingSoon(action: string) {
    soonAction = action
    showSoon = true
  }

  function onModalKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') showSoon = false
  }
</script>

<svelte:window onkeydown={(e) => { if (showSoon) onModalKeydown(e) }} />

<div class="page">
  <nav>
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">G</span>
      <span class="brand-name">Common Good</span>
    </div>
    {#if info}
      <div class="account">
        <span class="hi">Hi, {info.name}</span>
        <button class="ghost" onclick={signOut}>Sign out</button>
      </div>
    {/if}
  </nav>

  {#if loading}
    <main class="centered">
      <p class="state">Loading…</p>
    </main>
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
        <h1>Welcome back, {info.name}.</h1>
        <p>Here's your account at a glance.</p>
      </div>
    </div>

    <div class="container">
      <section class="summary">
        <article class="card summary-card">
          <div class="icon-wrap tone-green"><Icon name="bank" size={20} /></div>
          <div class="card-body">
            <span class="label">Available Balance</span>
            <span class="value">{fmtMoney(info.balance)}</span>
          </div>
        </article>

        <article class="card summary-card">
          <div class="icon-wrap tone-blue"><Icon name="clock" size={20} /></div>
          <div class="card-body">
            <span class="label">Pending Deposits</span>
            <span class="value">{fmtMoney(info.summary.pendingDeposits)}</span>
          </div>
        </article>

        <article class="card summary-card">
          <div class="icon-wrap tone-amber"><Icon name="clipboard" size={20} /></div>
          <div class="card-body">
            <span class="label">Pending Requests</span>
            <span class="value">{info.summary.pendingRequestsCount}</span>
          </div>
        </article>
      </section>

      <section class="actions card">
        <h2>Quick Actions</h2>
        <ul class="primary-actions">
          <li>
            <button type="button" onclick={() => comingSoon('Pay')}>
              <div class="icon-wrap tone-green"><Icon name="upload" size={20} /></div>
              <div>
                <span class="action-title">Pay</span>
                <span class="action-desc">Send funds to another member.</span>
              </div>
              <span class="soon-badge">Coming soon</span>
            </button>
          </li>
          <li>
            <button type="button" onclick={() => comingSoon('Receive')}>
              <div class="icon-wrap tone-green"><Icon name="download" size={20} /></div>
              <div>
                <span class="action-title">Receive</span>
                <span class="action-desc">Request funds from another member.</span>
              </div>
              <span class="soon-badge">Coming soon</span>
            </button>
          </li>
          <li>
            <button type="button" onclick={() => comingSoon('Transfer')}>
              <div class="icon-wrap tone-green"><Icon name="bank" size={20} /></div>
              <div>
                <span class="action-title">Transfer</span>
                <span class="action-desc">Move funds in or out of your account.</span>
              </div>
              <span class="soon-badge">Coming soon</span>
            </button>
          </li>
        </ul>
      </section>

      <section class="bottom">
        <div class="recent card">
          <h2>Recent Activity</h2>
          {#if info.txs.length === 0}
            <p class="empty">No transactions yet.</p>
          {:else}
            <ul>
              {#each info.txs as tx (tx.pending ? `p-${tx.created}-${tx.counterparty}` : `t-${tx.xid}`)}
                <li class:pending={tx.pending}>
                  <div class="icon-wrap tone-soft"><Icon name={txIcon(tx)} size={18} /></div>
                  <span class="text">{txDescription(tx)}</span>
                  {#if tx.pending}
                    <span class="pill pill-amber">Pending</span>
                  {/if}
                  <span class="amount" class:negative={tx.amount < 0}>{fmtMoney(tx.amount)}</span>
                  <span class="date">{fmtDate(tx.created)}</span>
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        <aside class="help card">
          <h3>Need help?</h3>
          <p>Our team is here for you.</p>
          <a class="primary-btn" href="mailto:support@commongood.earth">
            <Icon name="help" size={16} /> Contact Support
          </a>
        </aside>
      </section>
    </div>
  {/if}

  {#if showSoon}
    <button class="modal-backdrop" type="button" onclick={() => (showSoon = false)} aria-label="Close dialog"></button>
    <div class="modal card" role="dialog" aria-labelledby="soon-title" aria-modal="true" tabindex="-1">
      <h3 id="soon-title">{soonAction} — coming soon</h3>
      <p>This action will go live in the next phase of the Common Good member rebuild.</p>
      <button class="primary-btn" onclick={() => (showSoon = false)}>Got it</button>
    </div>
  {/if}
</div>

<style>
  .page { min-height: 100vh; display: flex; flex-direction: column; }

  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.75rem;
    background: var(--cg-surface);
    border-bottom: 1px solid var(--cg-border);
  }
  .brand { display: flex; align-items: center; gap: 0.6rem; }
  .brand-mark {
    display: grid; place-items: center;
    width: 2rem; height: 2rem;
    background: var(--cg-green); color: white;
    border-radius: 50%; font-weight: 700; font-size: 1rem; letter-spacing: -0.02em;
  }
  .brand-name {
    font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
    font-size: 0.85rem; color: var(--cg-text-muted);
  }
  .account { display: flex; align-items: center; gap: 1rem; }
  .hi { color: var(--cg-text); font-size: 0.95rem; }
  .ghost {
    padding: 0.5rem 0.9rem;
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

  .hero {
    background:
      linear-gradient(to right, rgba(245,247,244,1) 0%, rgba(245,247,244,0.6) 60%, rgba(245,247,244,0) 100%),
      linear-gradient(180deg, #eaf1ea 0%, #f5f7f4 100%);
    padding: 2.5rem 0 3.5rem;
    border-bottom: 1px solid var(--cg-border);
  }
  .hero-inner { max-width: 1280px; margin: 0 auto; padding: 0 1.75rem; }
  .hero h1 { margin: 0 0 0.4rem; font-size: 2rem; font-weight: 600; letter-spacing: -0.01em; }
  .hero p { margin: 0; color: var(--cg-text-muted); }

  .container { max-width: 1280px; margin: -2rem auto 3rem; padding: 0 1.75rem; display: grid; gap: 1.5rem; }

  .card {
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: var(--cg-shadow);
  }

  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
  .summary-card { display: flex; gap: 1rem; padding: 1.25rem; align-items: flex-start; }
  .icon-wrap {
    flex-shrink: 0; width: 2.75rem; height: 2.75rem;
    border-radius: 50%; display: grid; place-items: center;
  }
  .tone-green { background: rgba(30,122,58,0.1); color: var(--cg-green); }
  .tone-blue  { background: rgba(45,108,189,0.1); color: #2d6cbd; }
  .tone-amber { background: rgba(214,143,30,0.12); color: #b96e0c; }
  .tone-soft  { background: var(--cg-bg); color: var(--cg-text-muted); }

  .card-body { display: grid; gap: 0.25rem; }
  .label { font-size: 0.85rem; color: var(--cg-text-muted); font-weight: 500; }
  .value { font-size: 1.4rem; font-weight: 700; color: var(--cg-text); letter-spacing: -0.01em; }

  .actions { padding: 1.5rem; }
  .actions h2 { margin: 0 0 1rem; font-size: 1rem; font-weight: 600; }
  .primary-actions {
    list-style: none; padding: 0; margin: 0;
    display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.75rem;
  }
  .primary-actions button {
    width: 100%; display: flex; gap: 0.85rem;
    padding: 1rem;
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    background: var(--cg-surface); color: inherit; text-align: left;
    cursor: pointer; transition: border-color 0.15s, background 0.15s;
    align-items: flex-start; position: relative;
  }
  .primary-actions button:hover { border-color: var(--cg-green); background: var(--cg-green-soft); }
  .action-title { display: block; font-weight: 600; font-size: 0.95rem; color: var(--cg-text); margin-bottom: 0.15rem; }
  .action-desc { display: block; font-size: 0.82rem; color: var(--cg-text-muted); line-height: 1.35; }
  .soon-badge {
    position: absolute; top: 0.6rem; right: 0.6rem;
    font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
    color: var(--cg-text-muted);
    background: var(--cg-bg);
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
  }

  .bottom { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; }
  @media (max-width: 900px) { .bottom { grid-template-columns: 1fr; } }

  .recent { padding: 1.5rem; }
  .recent h2 { margin: 0 0 1rem; font-size: 1rem; font-weight: 600; }
  .empty { color: var(--cg-text-muted); margin: 0; }
  .recent ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
  .recent li {
    display: grid;
    grid-template-columns: auto 1fr auto auto auto;
    gap: 0.85rem; align-items: center;
    padding: 0.75rem 0.85rem;
    border-radius: var(--cg-radius-sm);
  }
  .recent li:hover { background: var(--cg-bg); }
  .text { font-size: 0.9rem; color: var(--cg-text); }
  .date { font-size: 0.82rem; color: var(--cg-text-muted); }
  .amount { font-size: 0.9rem; font-weight: 600; color: var(--cg-green); }
  .amount.negative { color: var(--cg-text); }
  .pill {
    font-size: 0.72rem; font-weight: 600;
    padding: 0.2rem 0.6rem; border-radius: 999px;
  }
  .pill-amber { background: rgba(214,143,30,0.14); color: #b96e0c; }

  .help { padding: 1.5rem; background: linear-gradient(180deg, #e9efe9 0%, #f0f4f0 100%); }
  .help h3 { margin: 0 0 0.4rem; font-size: 1rem; font-weight: 600; }
  .help p { margin: 0 0 1rem; color: var(--cg-text-muted); font-size: 0.9rem; }
  .primary-btn {
    width: 100%;
    display: inline-flex; align-items: center; gap: 0.4rem; justify-content: center;
    padding: 0.65rem 1rem;
    background: var(--cg-surface); color: var(--cg-text);
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    cursor: pointer; font-weight: 500;
  }
  .primary-btn:hover { border-color: var(--cg-green); }

  .modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(26, 31, 28, 0.4);
    border: none; padding: 0; cursor: pointer;
    z-index: 100;
  }
  .modal {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    max-width: 420px; width: calc(100% - 2rem);
    padding: 1.5rem;
    background: var(--cg-surface);
    z-index: 101;
  }
  .modal h3 { margin: 0 0 0.5rem; font-size: 1.1rem; font-weight: 600; }
  .modal p { margin: 0 0 1.25rem; color: var(--cg-text-muted); font-size: 0.9rem; }
</style>
