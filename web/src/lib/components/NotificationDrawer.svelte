<script lang="ts">
  import Icon from './Icon.svelte'

  type Notification = {
    id: string
    icon: string
    tone: 'green' | 'blue' | 'amber' | 'red'
    title: string
    body: string
    when: string
    unread: boolean
    href: string
  }

  type Props = { items?: Notification[] }
  let { items = defaultItems() }: Props = $props()

  let open = $state(false)
  const unreadCount = $derived(items.filter(i => i.unread).length)

  function close() { open = false }
  function markAllRead() {
    items = items.map(i => ({ ...i, unread: false }))
  }

  function defaultItems(): Notification[] {
    return [
      { id: '1', icon: 'shield', tone: 'red',   title: 'Deposit needs review',
        body: 'CL+P Distribution received $26,949.53 vs $26,000.00 expected.',
        when: '9:57 AM',  unread: true,  href: '/preview/grants' },
      { id: '2', icon: 'clock', tone: 'amber', title: 'Grant overdue',
        body: 'Enterprise for Youth — $49,500 expected May 19.',
        when: '8:14 AM',  unread: true,  href: '/preview/grants' },
      { id: '3', icon: 'user',  tone: 'blue',  title: 'New sponsee application',
        body: 'Pacific Forest Coalition is awaiting review.',
        when: 'Yesterday', unread: false, href: '/preview/admin/orgs' },
      { id: '4', icon: 'check', tone: 'green', title: 'Grant matched',
        body: 'Verizon Foundation $25,000 matched to expected.',
        when: 'May 21',   unread: false, href: '/preview/grants' }
    ]
  }
</script>

<svelte:window onclick={() => { /* allow outside click via capture below */ }} />

<div class="root">
  <button
    class="bell-btn"
    onclick={(e) => { e.stopPropagation(); open = !open }}
    aria-label="Notifications"
    aria-expanded={open}
  >
    <Icon name="bell" size={20} />
    {#if unreadCount > 0}
      <span class="badge">{unreadCount}</span>
    {/if}
  </button>

  {#if open}
    <div
      class="backdrop"
      onclick={close}
      role="presentation"
    ></div>

    <div class="drawer" role="dialog" aria-label="Notifications">
      <div class="drawer-head">
        <h3>Notifications</h3>
        {#if unreadCount > 0}
          <button class="mark-read" onclick={markAllRead}>Mark all read</button>
        {/if}
      </div>

      <ul>
        {#each items as n}
          <li class:unread={n.unread}>
            <a href={n.href} onclick={close}>
              <span class="n-icon tone-{n.tone}">
                <Icon name={n.icon} size={16} />
              </span>
              <div class="n-body">
                <span class="n-title">{n.title}</span>
                <span class="n-text">{n.body}</span>
                <span class="n-when">{n.when}</span>
              </div>
              {#if n.unread}<span class="dot"></span>{/if}
            </a>
          </li>
        {/each}
      </ul>

      <div class="drawer-foot">
        <a href="/preview/admin/alerts" onclick={close}>View all activity →</a>
      </div>
    </div>
  {/if}
</div>

<style>
  .root { position: relative; }

  .bell-btn {
    position: relative;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--cg-text-muted);
    padding: 0.4rem;
    display: grid;
    place-items: center;
  }
  .bell-btn:hover { color: var(--cg-text); }

  .badge {
    position: absolute;
    top: 0;
    right: 0;
    background: var(--cg-error);
    color: white;
    font-size: 0.65rem;
    font-weight: 600;
    min-width: 1rem;
    height: 1rem;
    border-radius: 999px;
    display: grid;
    place-items: center;
    padding: 0 0.3rem;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: transparent;
  }

  .drawer {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    width: min(380px, calc(100vw - 2rem));
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: 0 8px 16px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.1);
    z-index: 50;
    overflow: hidden;
  }
  .drawer-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.85rem 1.1rem;
    border-bottom: 1px solid var(--cg-border);
  }
  .drawer-head h3 { margin: 0; font-size: 0.95rem; font-weight: 600; }
  .mark-read { background: transparent; border: none; cursor: pointer; color: var(--cg-green); font-size: 0.82rem; font-weight: 500; padding: 0.2rem 0.4rem; }
  .mark-read:hover { text-decoration: underline; }

  .drawer ul { list-style: none; padding: 0; margin: 0; max-height: 440px; overflow-y: auto; }
  .drawer li { border-bottom: 1px solid var(--cg-border); }
  .drawer li:last-child { border-bottom: none; }
  .drawer li a {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.75rem;
    padding: 0.85rem 1.1rem;
    text-decoration: none;
    color: inherit;
    transition: background 0.12s;
  }
  .drawer li a:hover { background: var(--cg-bg); }
  .drawer li.unread { background: rgba(30,122,58,0.025); }

  .n-icon {
    width: 2.1rem; height: 2.1rem; border-radius: 50%;
    display: grid; place-items: center;
    flex-shrink: 0;
  }
  .tone-green { background: rgba(30,122,58,0.12); color: var(--cg-green); }
  .tone-blue  { background: rgba(45,108,189,0.12); color: #2d6cbd; }
  .tone-amber { background: rgba(214,143,30,0.14); color: #b96e0c; }
  .tone-red   { background: rgba(179,38,30,0.12); color: var(--cg-error); }

  .n-body { display: grid; gap: 0.15rem; min-width: 0; }
  .n-title { display: block; font-weight: 600; font-size: 0.88rem; color: var(--cg-text); }
  .n-text  { display: block; font-size: 0.82rem; color: var(--cg-text-muted); line-height: 1.35; }
  .n-when  { display: block; font-size: 0.72rem; color: var(--cg-text-muted); margin-top: 0.2rem; }

  .dot { width: 0.55rem; height: 0.55rem; border-radius: 50%; background: var(--cg-green); align-self: center; flex-shrink: 0; }

  .drawer-foot { padding: 0.65rem 1.1rem; background: var(--cg-bg); text-align: center; }
  .drawer-foot a { font-size: 0.85rem; color: var(--cg-green); }
</style>
