<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { env } from '$env/dynamic/public'
  import type { PageData } from './$types'
  import Icon from '$lib/components/Icon.svelte'
  import type { InfoResponse, InfoTx } from './api/me/info/+server'
  import { phpUrl } from '$lib/utils'
  import { inApp, appLink, device, type Device } from '$lib/app-shell'
  import { fade, fly } from 'svelte/transition'
  import { cubicOut } from 'svelte/easing'
  import { ms, focusIn, swipeDown } from '$lib/motion'

  let { data }: { data: PageData } = $props()

  let loading = $state(true)
  let error = $state<string | null>(null)
  let info = $state<InfoResponse | null>(null)
  let hasCamera = $state(false)
  let app = $state(false)
  let dev = $state<Device | null>(null)
  let message = $state<{ kind: 'info' | 'error', text: string } | null>(null)

  type ModalKind = 'pay' | 'receive' | null
  let modal = $state<ModalKind>(null)

  // Where the PHP member site lives. Menu items link to /<lowercased category> on this host.
  // Empty string = no PHP target configured; we render the menu as disabled.
  const phpBase = env.PUBLIC_PHP_BASE_URL ?? ''

  // A device's camera list can come back empty for a moment (seen with Chromium's fake camera), so look a few times before settling on the PHP links.
  async function detectCamera(tries = 4): Promise<boolean> {
    if (!navigator.mediaDevices?.enumerateDevices) return false
    for (let i = 0; i < tries; i++) {
      try {
        if ((await navigator.mediaDevices.enumerateDevices()).some(device => device.kind === 'videoinput')) return true
      } catch (cameraError) {
        console.warn('Could not detect a camera; keeping the PHP transaction links.', cameraError)
        return false
      }
      if (i < tries - 1) await new Promise(resolve => setTimeout(resolve, 500))
    }
    return false
  }

  function transactionUrl(intent: 'pay' | 'charge'): string {
    if (app) return appLink(dev, { intent }, env.PUBLIC_APP_URL)
    const pwaBase = data.cgpayPwaUrl.replace(/\/+$/, '')
    return hasCamera && pwaBase
      ? `${pwaBase}/handoff#intent=${intent}`
      : phpUrl(`tx/${intent}`)
  }

  /**
   * Fetch the dashboard data from the server and display it.
   * @param bool quiet: if true, keep showing the current data and ignore errors (a refresh)
   */
  async function loadInfo(quiet = false) {
    try {
      const res = await fetch('/api/me/info?limit=20', { cache: 'no-store' })
      if (res.status === 401) {
        await goto('/login')
        return
      }
      if (!res.ok) {
        if (quiet) return
        const body = await res.json().catch(() => ({}))
        error = body.message ?? `Failed to load dashboard (${res.status})`
        return
      }
      info = await res.json()
    } catch {
      if (!quiet) error = 'Network error - please try again.'
    } finally {
      loading = false
    }
  }

  // A message the legacy app left for us in a cookie (see setDashboardMessage in the legacy app's handoff.js): show it once, as text.
  function takeMessage(): { kind: 'info' | 'error', text: string } | null {
    const found = document.cookie.split('; ').find(c => c.startsWith('cgpay-msg='))
    const parts = location.hostname.split('.'), ip = /^\d+(\.\d+){3}$/.test(location.hostname)
    const domains = ['', ...(ip ? [] : parts.slice(0, -1).map((_, i) => `; domain=.${parts.slice(i).join('.')}`))] // whichever scope the sender chose (the legacy app's is the whole site)
    for (const d of domains) document.cookie = `cgpay-msg=; path=/; max-age=0${d}`
    if (!found) return null
    const m = decodeURIComponent(found.slice('cgpay-msg='.length)).match(/^(error|info):([\s\S]*)$/)
    return { kind: m?.[1] === 'error' ? 'error' : 'info', text: (m ? m[2] : '').slice(0, 300) }
  }

  onMount(async () => {
    message = takeMessage()
    app = inApp()
    if (app && data.user) device(data.user.name).then(d => dev = d)
    detectCamera().then(found => hasCamera = found) // without a camera this takes a moment; the account info need not wait
    await loadInfo()
  })

  // Returning from the legacy app (Back button, restored page): show current balance and transactions.
  function onPageShow(e: PageTransitionEvent) { if (e.persisted) loadInfo(true) }
  function onVisible() { if (document.visibilityState === 'visible' && info) loadInfo(true) }

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

  function firstName(fullName: string): string {
    return fullName.split(' ')[0]
  }
</script>

<svelte:window onkeydown={onKeydown} onpageshow={onPageShow} onvisibilitychange={onVisible} />

{#snippet chevron()}<span class="row-end"><Icon name="chevron" size={18} /></span>{/snippet}

<div class="dash">
  {#if loading}
    <main class="centered"><p class="muted">Loading...</p></main>
  {:else if error}
    <main class="centered">
      <div class="alert alert-error" role="alert"><Icon name="alert" size={20} /><p><strong>Something went wrong</strong><br />{error}</p></div>
    </main>
  {:else if info}
    <main class="container">
      {#if message}
        <div class="alert notice {message.kind === 'error' ? 'alert-error' : 'alert-ok'}" role={message.kind === 'error' ? 'alert' : 'status'} data-testid="notice-{message.kind}">
          <Icon name={message.kind === 'error' ? 'alert' : 'check'} size={20} />
          <p>{#if message.kind === 'error'}<strong>Something went wrong</strong>{/if}<span data-testid="msg">{message.text}</span></p>
          <button type="button" class="notice-close" aria-label="Dismiss" data-testid="msg-close" onclick={() => message = null}><Icon name="x" size={18} /></button>
        </div>
      {/if}

      <div class="layout">
        <div class="stack">
          <section class="card balance">
            <h1>Welcome back, {firstName(info.name)}</h1>
            <div class="bal">
              <span class="bal-label">Available funds</span>
              <span class="bal-value" data-testid="balance">{fmtMoney(info.balance)}</span>
            </div>
            <div class="actions">
              <a class="action-btn" data-testid="btn-pay" href={transactionUrl('pay') || '#'} aria-disabled={!phpBase && !(hasCamera && data.cgpayPwaUrl) || undefined}>
                <span class="action-icon out"><Icon name="upload" size={22} /></span>
                <span class="action-label">Pay</span>
                <span class="action-desc">Send funds to another member</span>
              </a>
              <a class="action-btn" data-testid="btn-receive" href={transactionUrl('charge') || '#'} aria-disabled={!phpBase && !(hasCamera && data.cgpayPwaUrl) || undefined}>
                <span class="action-icon"><Icon name="download" size={22} /></span>
                <span class="action-label">Receive</span>
                <span class="action-desc">Request funds from a member</span>
              </a>
              <a class="action-btn" href={phpUrl('get') || '#'} aria-disabled={!phpBase || undefined}>
                <span class="action-icon info"><Icon name="bank" size={22} /></span>
                <span class="action-label">Transfer</span>
                <span class="action-desc">Move funds in or out</span>
              </a>
            </div>
          </section>

          {#if info.summary.pendingPay > 0 || info.summary.pendingReceive > 0 || transferLabel(info)}
            <section class="card">
              <h2 class="card-title">Pending</h2>
              <ul class="list-rows">
                {#if info.summary.pendingPay > 0}
                  <li><button type="button" class="row-link pending-link" onclick={openPayPending}>
                    <span class="icon-dot out"><Icon name="clock" size={18} /></span>
                    <span class="row-text"><span class="row-title">To pay</span><span class="row-sub">Invoices waiting on you</span></span>
                    <span class="amt">{fmtMoney(info.summary.pendingPay)}</span>{@render chevron()}
                  </button></li>
                {/if}
                {#if info.summary.pendingReceive > 0}
                  <li><button type="button" class="row-link pending-link" onclick={openReceivePending}>
                    <span class="icon-dot"><Icon name="clock" size={18} /></span>
                    <span class="row-text"><span class="row-title">To receive</span><span class="row-sub">Invoices you're waiting on</span></span>
                    <span class="amt in">{fmtMoney(info.summary.pendingReceive)}</span>{@render chevron()}
                  </button></li>
                {/if}
                {#if transferLabel(info)}
                  <li><div class="row-link static">
                    <span class="icon-dot info"><Icon name="bank" size={18} /></span>
                    <span class="row-text"><span class="row-title">Bank transfer</span><span class="row-sub pending-static">{transferLabel(info)}</span></span>
                  </div></li>
                {/if}
              </ul>
            </section>
          {/if}

          <section class="card">
            <h2 class="card-title">Recent activity</h2>
            {#if info.txs.filter(t => !t.pending).length === 0}
              <p class="empty">No activity yet. Payments you make and receive will show up here.</p>
            {:else}
              <ul class="list-rows">
                {#each info.txs.filter(t => !t.pending) as tx (tx.xid)}
                  <li class="tx">
                    <span class="icon-dot {tx.amount >= 0 ? '' : 'out'}"><Icon name={tx.amount >= 0 ? 'download' : 'upload'} size={18} /></span>
                    <span class="row-text">
                      <span class="row-title"><span class="sr-only">{tx.amount >= 0 ? 'Received from' : 'Paid to'}</span> {tx.counterparty}</span>
                      <span class="row-sub">{tx.description ? `${tx.description} - ` : ''}{fmtDate(tx.created)}</span>
                    </span>
                    <span class="amt" class:in={tx.amount >= 0}>{tx.amount >= 0 ? '+' : '-'}{fmtMoney(Math.abs(tx.amount))}</span>
                  </li>
                {/each}
              </ul>
            {/if}
          </section>
        </div>

        <aside class="card">
          <h2 class="card-title">Quick Actions</h2>
          <ul class="list-rows">
            {#if info.sponsored}
              <li><a class="row-link" href="/grants">
                <span class="icon-dot"><Icon name="plus" size={18} /></span>
                <span class="row-text"><span class="row-title">Expected Grants</span><span class="row-sub">View reported grants or tell us about incoming funding</span></span>{@render chevron()}
              </a></li>
            {/if}
            <li><a class="row-link" href={phpUrl('settings') || '#'} aria-disabled={!phpBase || undefined}>
              <span class="icon-dot info"><Icon name="user" size={18} /></span>
              <span class="row-text"><span class="row-title">Profile & Settings</span><span class="row-sub">Update your account details</span></span>{@render chevron()}
            </a></li>
            <li><a class="row-link" href={phpUrl('help') || 'mailto:support@commongood.earth'}>
              <span class="icon-dot info"><Icon name="help" size={18} /></span>
              <span class="row-text"><span class="row-title">Contact Support</span><span class="row-sub">Our team is here for you</span></span>{@render chevron()}
            </a></li>
          </ul>
        </aside>
      </div>
    </main>

    <footer class="footer">
      <ul class="footer-links">
        <li><a href={phpUrl('community/donate') || '#'}>Donate</a></li>
        <li><a href={phpUrl('community/invite') || '#'}>Invite Someone</a></li>
        <li><a href={phpUrl('signup-co/relate=1') || '#'}>Open a Company Account</a></li>
        <li><a href={phpUrl('prejoin') || '#'}>Make Joint Account</a></li>
        <li><a href="https://commongood.earth/about-us" target="_blank" rel="noopener">About Us</a></li>
        <li><a href={phpUrl('community/agreement') || '#'}>The Agreement</a></li>
        <li><a href="https://commongood.earth/about-us/privacy-and-security" target="_blank" rel="noopener">Security</a></li>
        <li><a href={phpUrl('help') || 'mailto:support@commongood.earth'}>Help</a></li>
      </ul>
      <p class="copyright">copyright &copy; {new Date().getFullYear()} Common Good&reg;, a nonprofit organization</p>
    </footer>
  {/if}

  {#if modal && info}
    {@const pay = modal === 'pay'}
    <button class="sheet-backdrop" type="button" onclick={closeModal} aria-label="Close dialog" transition:fade={{ duration: ms(200) }}></button>
    <div class="sheet" role="dialog" aria-labelledby="modal-title" aria-modal="true" tabindex="-1"
      use:focusIn use:swipeDown={closeModal} transition:fly={{ y: 64, duration: ms(280), easing: cubicOut }}>
      <div class="grip" aria-hidden="true"></div>
      <h3 id="modal-title">{pay ? 'Pending payments' : 'Pending receivables'}</h3>
      <p class="muted">{pay ? 'Invoices waiting on you.' : "Invoices you're waiting on."}</p>
      <ul class="list-rows">
        {#each pay ? payPendingItems(info) : receivePendingItems(info) as tx}
          <li class="tx">
            <span class="row-text">
              <span class="row-title">{tx.counterparty}</span>
              <span class="row-sub">{tx.description ? `${tx.description} - ` : ''}{fmtDate(tx.created)}</span>
            </span>
            <span class="amt" class:in={!pay}>{fmtMoney(Math.abs(tx.amount))}</span>
          </li>
        {/each}
      </ul>
      <button class="btn btn-secondary btn-block" onclick={closeModal}>Close</button>
    </div>
  {/if}
</div>

<style>
  .dash { flex: 1; display: flex; flex-direction: column; }
  .centered { flex: 1; display: grid; place-items: center; padding: var(--sp-6) var(--gutter); }
  .container { flex: 1; display: grid; gap: var(--sp-4); align-content: start; }

  .notice p { flex: 1; display: grid; gap: 2px; }
  .notice-close { border: 0; background: none; color: inherit; cursor: pointer; display: grid; place-items: center; width: var(--tap); height: var(--tap); margin: -12px -12px -12px 0; }

  .layout { display: grid; gap: var(--sp-4); align-items: start; }
  @media (min-width: 960px) { .layout { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); gap: var(--sp-5); } }

  .card-title { font-size: var(--fs-base); padding: var(--sp-4) var(--sp-4) var(--sp-2); }
  .empty { padding: var(--sp-2) var(--sp-4) var(--sp-5); color: var(--cg-text-muted); }
  .list-rows > li > .row-link { border-radius: 0; }
  .list-rows > li:last-child > .row-link { border-radius: 0 0 var(--r-md) var(--r-md); }

  .balance { padding: var(--sp-5) var(--sp-4) var(--sp-4); display: grid; gap: var(--sp-5); }
  .balance h1 { font-size: var(--fs-base); font-weight: 500; color: var(--cg-text-muted); letter-spacing: 0; }
  .bal { display: grid; gap: var(--sp-1); margin-top: calc(-1 * var(--sp-3)); }
  .bal-label { font-size: var(--fs-sm); color: var(--cg-text-muted); }
  .bal-value { font-size: var(--fs-num); font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }

  .actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-2); }
  .action-btn {
    display: grid; justify-items: center; align-content: center; gap: var(--sp-2);
    min-height: 92px; padding: var(--sp-3) var(--sp-2);
    background: var(--cg-surface-2); border-radius: var(--r-md); color: var(--cg-text); text-align: center; text-decoration: none;
    transition: background-color var(--dur-fast), transform var(--dur-fast) var(--ease-out);
  }
  .action-btn:hover { text-decoration: none; }
  .action-btn:active { transform: scale(0.97); background: var(--cg-border); }
  @media (hover: hover) { .action-btn:hover { background: var(--cg-border); } }
  .action-icon { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--cg-surface); color: var(--cg-green); box-shadow: var(--shadow-1); }
  .action-icon.out { color: var(--cg-out); }
  .action-icon.info { color: var(--cg-info); }
  .action-label { font-weight: 600; }
  .action-desc { display: none; font-size: var(--fs-xs); color: var(--cg-text-muted); line-height: 1.3; }
  @media (min-width: 640px) {
    .balance { padding: var(--sp-5); }
    .action-btn { min-height: 120px; }
    .action-desc { display: block; }
  }

  .static { cursor: default; }
  .static:active, .static:hover { background: none; }
  .tx { display: flex; align-items: center; gap: var(--sp-3); min-height: 64px; padding: var(--sp-3) var(--sp-4); }
  .row-text .row-title, .row-text .row-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .amt { font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .amt.in { color: var(--cg-green); }

  .footer { padding: var(--sp-5) var(--gutter) var(--sp-2); text-align: center; border-top: 1px solid var(--cg-border); }
  .footer-links { list-style: none; padding: 0; margin: 0 auto var(--sp-2); max-width: 44rem; display: flex; flex-wrap: wrap; justify-content: center; }
  .footer-links a { display: inline-block; padding: var(--sp-2) var(--sp-3); color: var(--cg-text-muted); font-size: var(--fs-sm); }
  .copyright { font-size: var(--fs-xs); color: var(--cg-text-subtle); }

  .sheet-backdrop { position: fixed; inset: 0; z-index: 100; border: 0; padding: 0; background: rgba(16, 24, 20, 0.45); cursor: pointer; }
  .sheet {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 101;
    max-height: 85dvh; overflow-y: auto; overscroll-behavior: contain;
    padding: var(--sp-2) var(--sp-4) calc(var(--sp-4) + env(safe-area-inset-bottom));
    background: var(--cg-surface); border-radius: var(--r-lg) var(--r-lg) 0 0; box-shadow: var(--shadow-2);
    display: grid; gap: var(--sp-3);
  }
  .sheet:focus { outline: none; }
  .grip { width: 40px; height: 5px; border-radius: 3px; background: var(--cg-border-strong); justify-self: center; margin-bottom: var(--sp-2); }
  .sheet h3 { font-size: var(--fs-lg); }
  .sheet .tx { padding: var(--sp-3) 0; }
  @media (min-width: 640px) {
    .sheet { inset: 0; margin: auto; width: min(460px, calc(100% - 2 * var(--gutter))); height: fit-content; max-height: 80vh; border-radius: var(--r-md); padding: var(--sp-5); }
    .grip { display: none; }
  }
</style>
