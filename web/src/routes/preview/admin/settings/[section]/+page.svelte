<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'
  import { page } from '$app/state'

  const section = $derived(page.params.section)

  type SectionDef = {
    title: string
    desc: string
    icon: string
    fields: { label: string; type: 'text' | 'switch' | 'select' | 'note'; value?: string; options?: string[]; help?: string }[]
  }

  const sections: Record<string, SectionDef> = {
    org: {
      title: 'Organization profile',
      desc: 'Legal name, address, tax ID, and primary contact.',
      icon: 'bank',
      fields: [
        { label: 'Legal name',    type: 'text',   value: 'Common Good Inc.' },
        { label: 'Tax ID (EIN)',  type: 'text',   value: '47-1234567' },
        { label: 'Primary contact', type: 'text', value: 'Jose Cruz · jose@commongood.earth' },
        { label: 'Mailing address', type: 'text', value: 'P.O. Box 12345, Oakland, CA 94612' },
        { label: 'Public website',  type: 'text', value: 'https://commongood.earth' }
      ]
    },
    branding: {
      title: 'Branding',
      desc: 'Logo, colors, and the wordmark used in emails and the member dashboard.',
      icon: 'shield',
      fields: [
        { label: 'Wordmark',     type: 'text',   value: 'Common Good' },
        { label: 'Primary color', type: 'text',  value: '#1e7a3a', help: 'Used for buttons, links, and the dashboard accent.' },
        { label: 'Logo (SVG)',   type: 'note',   help: 'Upload an SVG to replace the text "G" used in the brand mark.' },
        { label: 'Email signature', type: 'text', value: 'The Common Good team' }
      ]
    },
    notifications: {
      title: 'Notification defaults',
      desc: 'What members opt in to by default and the bi-weekly update schedule.',
      icon: 'chat',
      fields: [
        { label: 'Service updates',   type: 'switch', value: 'on',  help: 'Always on — required for incident communication.' },
        { label: 'Bi-weekly updates', type: 'switch', value: 'on',  help: 'Sent every other Tuesday at 10 AM ET.' },
        { label: 'Marketing',         type: 'switch', value: 'off', help: 'Events, partnerships, and fundraising.' },
        { label: 'Media release',     type: 'switch', value: 'off', help: 'Include in case studies and press materials.' }
      ]
    },
    integrations: {
      title: 'Integrations',
      desc: 'QuickBooks Online, Postmark, Mailerlite, and other connected services.',
      icon: 'folder',
      fields: [
        { label: 'Postmark (transactional email)', type: 'note', help: '✓ Connected. Last delivery test: 2 minutes ago.' },
        { label: 'Mailerlite (broadcasts)',         type: 'note', help: '✓ Connected. 342 subscribers synced.' },
        { label: 'QuickBooks Online',               type: 'note', help: '⚠ Token expired — needs reauth.' },
        { label: 'Plaid (bank linking)',            type: 'note', help: '✓ Connected. Sandbox mode disabled.' }
      ]
    },
    billing: {
      title: 'Billing & plan',
      desc: 'Plan tier, current usage, and payment method.',
      icon: 'download',
      fields: [
        { label: 'Plan',            type: 'note', help: 'Foundation · $400/month' },
        { label: 'Members',         type: 'note', help: '342 / 500 included' },
        { label: 'Sponsored orgs',  type: 'note', help: '48 / 50 included' },
        { label: 'Payment method',  type: 'note', help: 'Visa ····8821 · expires 04/2027' }
      ]
    },
    security: {
      title: 'Security',
      desc: 'Admin roles, sign-in policy, and audit log retention.',
      icon: 'user',
      fields: [
        { label: 'Require 2FA for admins',        type: 'switch', value: 'on' },
        { label: 'Session timeout',                type: 'select', value: '8 hours', options: ['1 hour', '4 hours', '8 hours', '24 hours'] },
        { label: 'Audit log retention',            type: 'select', value: '365 days', options: ['30 days', '90 days', '365 days', 'Forever'] },
        { label: 'Allowed IP addresses',           type: 'note', help: 'No restrictions configured.' }
      ]
    }
  }

  const def = $derived(section ? sections[section] ?? null : null)
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/admin">Admin</a> <span>›</span>
    <a href="/preview/admin/settings">Settings</a> <span>›</span>
    <span>{def?.title ?? section}</span>
  </nav>

  {#if !def}
    <div class="not-found card">
      <h2>Section not found</h2>
      <p>"{section}" isn't a known settings section.</p>
      <a href="/preview/admin/settings">← Back to Settings</a>
    </div>
  {:else}
    <header>
      <div class="head-id">
        <div class="icon-wrap"><Icon name={def.icon} size={20} /></div>
        <div>
          <h1>{def.title}</h1>
          <p>{def.desc}</p>
        </div>
      </div>
      <button class="primary">Save changes</button>
    </header>

    <div class="card form">
      {#each def.fields as f}
        <div class="field">
          <span class="label">{f.label}</span>
          {#if f.type === 'text'}
            <input type="text" value={f.value} />
          {:else if f.type === 'select'}
            <select>
              {#each (f.options ?? []) as o}
                <option selected={o === f.value}>{o}</option>
              {/each}
            </select>
          {:else if f.type === 'switch'}
            <label class="switch">
              <input type="checkbox" checked={f.value === 'on'} />
              <span class="track"><span class="thumb"></span></span>
              <span class="sw-label">{f.value === 'on' ? 'On' : 'Off'}</span>
            </label>
          {:else if f.type === 'note'}
            <div class="note-val">—</div>
          {/if}
          {#if f.help}<span class="help">{f.help}</span>{/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .container { max-width: 760px; margin: 0 auto; padding: 1.5rem 1.75rem 3rem; }
  .crumbs { font-size: 0.85rem; color: var(--cg-text-muted); margin-bottom: 1rem; }
  .crumbs a { color: var(--cg-green); }
  .crumbs span { margin: 0 0.5rem; }

  header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.25rem; gap: 1rem; }
  .head-id { display: flex; gap: 0.85rem; align-items: center; }
  .icon-wrap { width: 2.6rem; height: 2.6rem; border-radius: 50%; background: rgba(30,122,58,0.1); color: var(--cg-green); display: grid; place-items: center; flex-shrink: 0; }
  header h1 { margin: 0 0 0.2rem; font-size: 1.4rem; font-weight: 600; letter-spacing: -0.01em; }
  header p { margin: 0; color: var(--cg-text-muted); font-size: 0.88rem; }
  .primary { padding: 0.55rem 1rem; background: var(--cg-green); color: white; border: none; border-radius: var(--cg-radius-sm); font-size: 0.88rem; font-weight: 500; cursor: pointer; }
  .primary:hover { background: var(--cg-green-hover); }

  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }
  .form { padding: 1.25rem 1.5rem; display: grid; gap: 1.25rem; }

  .field { display: grid; gap: 0.4rem; }
  .label { font-size: 0.85rem; font-weight: 500; color: var(--cg-text); }
  .help { font-size: 0.78rem; color: var(--cg-text-muted); }

  input[type='text'], select { padding: 0.6rem 0.85rem; font-size: 0.95rem; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); background: var(--cg-surface); color: var(--cg-text); }
  input[type='text']:focus, select:focus { outline: none; border-color: var(--cg-green); box-shadow: 0 0 0 3px var(--cg-green-soft); }

  .note-val { padding: 0.5rem 0; color: var(--cg-text-muted); font-size: 0.95rem; }

  .switch { display: inline-flex; align-items: center; gap: 0.6rem; cursor: pointer; }
  .switch input { display: none; }
  .track { width: 2.4rem; height: 1.35rem; background: var(--cg-border); border-radius: 999px; position: relative; transition: background 0.15s; }
  .thumb { position: absolute; top: 2px; left: 2px; width: 1.05rem; height: 1.05rem; background: white; border-radius: 50%; transition: transform 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
  .switch input:checked + .track { background: var(--cg-green); }
  .switch input:checked + .track .thumb { transform: translateX(1.05rem); }
  .sw-label { font-size: 0.85rem; color: var(--cg-text-muted); font-weight: 500; }

  .not-found { padding: 2rem; text-align: center; }
  .not-found h2 { margin: 0 0 0.5rem; }
  .not-found p { margin: 0 0 1rem; color: var(--cg-text-muted); }
  .not-found a { color: var(--cg-green); }
</style>
