<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'
  import Tooltip from '$lib/components/Tooltip.svelte'
  import { page } from '$app/state'

  // UI preview — the id surfaces in the breadcrumb so the dynamic route is obvious,
  // but the rendered profile is the same fixture every time.
  const id = $derived(page.params.id)

  const user = {
    name: 'Jane Smith',
    email: 'jane@earthseed.org',
    phone: '+1 415 555 0142',
    role: 'Sponsee Lead',
    status: 'Active' as const,
    org: 'EarthSeed Consulting',
    orgSlug: 'earthseed',
    memberSince: 'Jan 12, 2024',
    lastLogin: 'May 27, 2026 · 9:14 AM',
    logins30d: 14,
    timezone: 'America/Los_Angeles',
    twoFactor: 'Enabled (TOTP)',
    avatarTone: 'green'
  }

  type Tab = 'Overview' | 'Activity' | 'Organizations' | 'Permissions'
  let tab = $state<Tab>('Overview')

  const orgs = [
    { name: 'EarthSeed Consulting', slug: 'earthseed', role: 'Sponsee Lead', joined: 'Jan 12, 2024', primary: true }
  ]

  const activity = [
    { tone: 'green', text: 'Signed in from Oakland, CA (Chrome, macOS)',                       when: 'May 27, 2026 · 9:14 AM' },
    { tone: 'blue',  text: 'Reported expected grant: Verizon Foundation · $25,000',            when: 'May 21, 2026 · 11:01 AM' },
    { tone: 'blue',  text: 'Uploaded document: Award Letter — Community Food Initiative',     when: 'May 15, 2026 · 4:08 PM' },
    { tone: 'amber', text: 'Updated profile: changed phone number',                            when: 'May 09, 2026 · 2:32 PM' },
    { tone: 'green', text: 'Enabled two-factor authentication',                                when: 'Mar 03, 2025 · 11:47 AM' }
  ]

  // Permissions are derived from the role. Concrete for the preview.
  const permissions: { area: string; allowed: string[]; denied: string[] }[] = [
    {
      area: 'Grants',
      allowed: ['Submit expected grants', 'View own organization grants', 'Upload supporting documents'],
      denied:  ['View other organizations\' grants', 'Approve or reconcile deposits']
    },
    {
      area: 'Organization',
      allowed: ['Edit organization profile', 'Invite members', 'Assign roles within own org'],
      denied:  ['Delete organization', 'Change tax ID or banking info without admin review']
    },
    {
      area: 'Communications',
      allowed: ['Receive broadcasts', 'Update own notification preferences'],
      denied:  ['Send broadcasts', 'Edit templates or audiences']
    },
    {
      area: 'Reports',
      allowed: ['Run reports scoped to own organization', 'Export own data'],
      denied:  ['Run system-wide reports', 'Access compliance reports for other orgs']
    }
  ]

  function pillFor(status: string): string {
    if (status === 'Active') return 'pill-green'
    if (status === 'Pending') return 'pill-blue'
    return 'pill-red'
  }

  function initialsOf(name: string): string {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/admin">Admin</a> <span>›</span>
    <a href="/preview/admin/users">Users</a> <span>›</span>
    <span>{user.name}</span>
  </nav>

  <section class="hero card">
    <div class="hero-main">
      <div class="hero-id">
        <div class="avatar tone-{user.avatarTone}">{initialsOf(user.name)}</div>
        <div>
          <h1>{user.name}</h1>
          <span class="contact">{user.email} · {user.phone} <span class="muted">· id: {id}</span></span>
        </div>
      </div>
      <div class="hero-actions">
        <span class="pill {pillFor(user.status)}">{user.status}</span>

        <Tooltip text="Open an email or in-app message to this member" position="bottom">
          <button class="ghost"><Icon name="chat" size={14} /> Message</button>
        </Tooltip>

        <Tooltip text="Send a one-time password-reset link to the member's email" position="bottom">
          <button class="ghost"><Icon name="shield" size={14} /> Reset password</button>
        </Tooltip>

        <Tooltip text="Temporarily disable this account — they cannot sign in until restored" position="bottom">
          <button class="ghost danger"><Icon name="x" size={14} /> Suspend</button>
        </Tooltip>
      </div>
    </div>

    <dl class="hero-meta">
      <div><dt>Role</dt><dd>{user.role}</dd></div>
      <div><dt>Organization</dt><dd><a href="/preview/admin/orgs/{user.orgSlug}">{user.org}</a></dd></div>
      <div><dt>Member since</dt><dd>{user.memberSince}</dd></div>
      <div><dt>Last login</dt><dd>{user.lastLogin}</dd></div>
      <div><dt>Sign-ins (30d)</dt><dd>{user.logins30d}</dd></div>
      <div><dt>Two-factor</dt><dd>{user.twoFactor}</dd></div>
    </dl>
  </section>

  <div class="card content">
    <div class="tabs">
      {#each ['Overview','Activity','Organizations','Permissions'] as t}
        <button class:active={tab === t} onclick={() => (tab = t as Tab)}>{t}</button>
      {/each}
    </div>

    {#if tab === 'Overview'}
      <div class="overview">
        <section>
          <h3>Contact</h3>
          <ul class="contact-list">
            <li><span class="label">Email</span><span>{user.email}</span></li>
            <li><span class="label">Phone</span><span>{user.phone}</span></li>
            <li><span class="label">Timezone</span><span>{user.timezone}</span></li>
          </ul>
        </section>
        <section>
          <h3>Role description</h3>
          <p>
            <strong>Sponsee Leads</strong> are the primary point of contact at a sponsored organization.
            They can submit expected grants, manage their organization profile, invite teammates, and
            assign roles within their org. They cannot approve deposits, send broadcasts, or access
            data outside their own organization.
          </p>
        </section>
      </div>
    {:else if tab === 'Activity'}
      <ul class="activity">
        {#each activity as a}
          <li>
            <span class="dot dot-{a.tone}"></span>
            <div>
              <span class="act-text">{a.text}</span>
              <span class="act-when">{a.when}</span>
            </div>
          </li>
        {/each}
      </ul>
    {:else if tab === 'Organizations'}
      <table>
        <thead><tr><th>Organization</th><th>Role</th><th>Joined</th><th></th></tr></thead>
        <tbody>
          {#each orgs as o}
            <tr>
              <td>
                <a href="/preview/admin/orgs/{o.slug}">{o.name}</a>
                {#if o.primary}<span class="tag-primary">Primary</span>{/if}
              </td>
              <td>{o.role}</td>
              <td class="muted">{o.joined}</td>
              <td><a class="muted-link" href="/preview/admin/orgs/{o.slug}">View →</a></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else if tab === 'Permissions'}
      <div class="perms">
        {#each permissions as p}
          <section class="perm-section">
            <h3>{p.area}</h3>
            <div class="perm-cols">
              <div>
                <span class="perm-label"><Icon name="check" size={14} /> Allowed</span>
                <ul>{#each p.allowed as a}<li>{a}</li>{/each}</ul>
              </div>
              <div>
                <span class="perm-label denied"><Icon name="x" size={14} /> Denied</span>
                <ul>{#each p.denied as d}<li>{d}</li>{/each}</ul>
              </div>
            </div>
          </section>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .container { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1.75rem 3rem; }
  .crumbs { font-size: 0.85rem; color: var(--cg-text-muted); margin-bottom: 1rem; }
  .crumbs a { color: var(--cg-green); }
  .crumbs span { margin: 0 0.5rem; }

  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }

  .hero { padding: 1.5rem; margin-bottom: 1.5rem; }
  .hero-main { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .hero-id { display: flex; gap: 1rem; align-items: center; }
  .avatar { width: 3.25rem; height: 3.25rem; border-radius: 50%; color: white; display: grid; place-items: center; font-weight: 700; font-size: 1.05rem; flex-shrink: 0; }
  .avatar.tone-green { background: linear-gradient(135deg, #b8d4be 0%, #6fa67e 100%); }
  .hero h1 { margin: 0 0 0.2rem; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.01em; }
  .contact { font-size: 0.88rem; color: var(--cg-text-muted); }
  .muted { color: var(--cg-text-muted); }

  .hero-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
  .ghost { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.85rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.85rem; cursor: pointer; color: var(--cg-text); }
  .ghost:hover { border-color: var(--cg-green); }
  .ghost.danger { color: var(--cg-error); }
  .ghost.danger:hover { border-color: var(--cg-error); background: rgba(179,38,30,0.05); }

  .hero-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem 1rem; padding: 1rem; background: var(--cg-bg); border-radius: var(--cg-radius-sm); margin: 0; }
  .hero-meta div { display: grid; gap: 0.15rem; }
  dt { font-size: 0.7rem; color: var(--cg-text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
  dd { margin: 0; font-size: 0.9rem; font-weight: 500; color: var(--cg-text); }
  dd a { color: var(--cg-green); text-decoration: none; }
  dd a:hover { text-decoration: underline; }

  .content { padding: 1.25rem; }
  .tabs { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--cg-border); margin: -0.5rem -1.25rem 1.25rem; padding: 0 1.25rem; }
  .tabs button { padding: 0.85rem 0.7rem; background: transparent; border: none; cursor: pointer; color: var(--cg-text-muted); font-size: 0.92rem; font-weight: 500; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .tabs button.active { color: var(--cg-green); border-bottom-color: var(--cg-green); }

  .overview { display: grid; gap: 1.5rem; }
  .overview h3 { margin: 0 0 0.5rem; font-size: 0.95rem; font-weight: 600; }
  .overview p { margin: 0; color: var(--cg-text-muted); line-height: 1.55; }
  .overview strong { color: var(--cg-text); }

  .contact-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.4rem; }
  .contact-list li { display: grid; grid-template-columns: 120px 1fr; gap: 1rem; padding: 0.4rem 0; }
  .label { font-size: 0.8rem; color: var(--cg-text-muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }

  .pill { font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap; }
  .pill-green { background: rgba(30,122,58,0.12); color: var(--cg-green); }
  .pill-blue  { background: rgba(45,108,189,0.12); color: #2d6cbd; }
  .pill-red   { background: rgba(179,38,30,0.12); color: var(--cg-error); }

  .activity { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.6rem; }
  .activity li { display: grid; grid-template-columns: auto 1fr; gap: 0.85rem; padding: 0.75rem 1rem; background: var(--cg-bg); border-radius: var(--cg-radius-sm); }
  .dot { width: 0.6rem; height: 0.6rem; border-radius: 50%; margin-top: 0.3rem; }
  .dot-green { background: var(--cg-green); }
  .dot-blue { background: #2d6cbd; }
  .dot-amber { background: #e89826; }
  .dot-red { background: var(--cg-error); }
  .act-text { display: block; font-size: 0.92rem; line-height: 1.4; }
  .act-when { display: block; font-size: 0.78rem; color: var(--cg-text-muted); margin-top: 0.15rem; }

  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  thead th { text-align: left; padding: 0.65rem 0.85rem; color: var(--cg-text-muted); font-weight: 500; font-size: 0.82rem; border-bottom: 1px solid var(--cg-border); }
  tbody td { padding: 0.85rem; border-bottom: 1px solid var(--cg-border); }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--cg-bg); }
  td a { color: var(--cg-green); text-decoration: none; }
  td a:hover { text-decoration: underline; }
  .muted-link { color: var(--cg-text-muted) !important; font-size: 0.85rem; }
  .tag-primary { display: inline-block; margin-left: 0.5rem; padding: 0.1rem 0.45rem; background: var(--cg-bg); border: 1px solid var(--cg-border); border-radius: 999px; font-size: 0.7rem; color: var(--cg-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

  .perms { display: grid; gap: 1.5rem; }
  .perm-section h3 { margin: 0 0 0.85rem; font-size: 0.95rem; font-weight: 600; }
  .perm-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  @media (max-width: 700px) { .perm-cols { grid-template-columns: 1fr; } }
  .perm-cols > div { padding: 0.85rem 1rem; background: var(--cg-bg); border-radius: var(--cg-radius-sm); }
  .perm-label { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 600; color: var(--cg-green); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.5rem; }
  .perm-label.denied { color: var(--cg-error); }
  .perm-cols ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.3rem; }
  .perm-cols li { font-size: 0.88rem; color: var(--cg-text); padding-left: 0.65rem; position: relative; }
  .perm-cols li::before { content: '·'; position: absolute; left: 0; color: var(--cg-text-muted); }
</style>
