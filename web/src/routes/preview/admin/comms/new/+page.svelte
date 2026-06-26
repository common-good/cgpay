<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'
  import { goto } from '$app/navigation'

  // Audience options match the audiences page
  const audiences = [
    { id: 'all',       label: 'All members',      count: 342 },
    { id: 'sponsees',  label: 'Sponsee leads',    count: 48  },
    { id: 'finance',   label: 'Finance contacts', count: 31  },
    { id: 'affected',  label: 'Affected only',    count: 6   },
    { id: 'board',     label: 'Board members',    count: 12  }
  ]

  let template = $state<'blank' | 'service' | 'biweekly' | 'affected'>('blank')
  let audience = $state('all')
  let subject = $state('')
  let body = $state('')
  let when = $state<'now' | 'schedule'>('now')
  let scheduledFor = $state('2026-06-04T10:00')

  // Apply a template when it changes
  $effect(() => {
    if (template === 'service') {
      subject = 'Service update — recent improvements'
      body = `Dear members,

We wanted to share a quick update on recent improvements we've made…`
    } else if (template === 'biweekly') {
      subject = 'Bi-weekly update — highlights and resources'
      body = `Hi everyone,

Here's what's been happening in the Common Good community this fortnight…`
    } else if (template === 'affected') {
      subject = 'A direct note from us'
      body = `Hi,

We're writing because you were affected by the recent banking delays…`
    } else if (template === 'blank') {
      subject = ''
      body = ''
    }
  })

  let sent = $state(false)
  const ready = $derived(subject.trim().length > 0 && body.trim().length > 0 && !!audience)
  const selectedAudience = $derived(audiences.find(a => a.id === audience))

  function send() {
    if (!ready) return
    sent = true
    setTimeout(() => goto('/preview/admin/comms'), 1800)
  }
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/admin">Admin</a> <span>›</span>
    <a href="/preview/admin/comms">Communications</a> <span>›</span>
    <span>New broadcast</span>
  </nav>

  {#if sent}
    <div class="card sent">
      <div class="check"><Icon name="check" size={28} /></div>
      <h2>Broadcast {when === 'now' ? 'sent' : 'scheduled'}</h2>
      <p>{when === 'now'
        ? `Sent to ${selectedAudience?.label} (${selectedAudience?.count} recipients).`
        : `Scheduled for ${new Date(scheduledFor).toLocaleString()}.`}</p>
    </div>
  {:else}
    <div class="layout">
      <main class="form">
        <header>
          <h1>New broadcast</h1>
          <div class="actions">
            <button class="ghost">Save draft</button>
            <button class="primary" disabled={!ready} onclick={send}>
              {when === 'now' ? 'Send now' : 'Schedule'}
            </button>
          </div>
        </header>

        <section class="card">
          <h2>Start from</h2>
          <div class="templates">
            <button class="t" class:selected={template === 'blank'}    onclick={() => (template = 'blank')}>Blank</button>
            <button class="t" class:selected={template === 'service'}  onclick={() => (template = 'service')}>Service update</button>
            <button class="t" class:selected={template === 'biweekly'} onclick={() => (template = 'biweekly')}>Bi-weekly update</button>
            <button class="t" class:selected={template === 'affected'} onclick={() => (template = 'affected')}>Affected-user notice</button>
          </div>
        </section>

        <section class="card">
          <h2>Audience</h2>
          <select bind:value={audience}>
            {#each audiences as a}
              <option value={a.id}>{a.label} · {a.count} recipients</option>
            {/each}
          </select>
        </section>

        <section class="card">
          <h2>Subject</h2>
          <input type="text" placeholder="What's the email about?" bind:value={subject} maxlength="120" />
        </section>

        <section class="card">
          <h2>Message</h2>
          <textarea placeholder="Write your message…" bind:value={body} rows="10"></textarea>
        </section>

        <section class="card">
          <h2>When to send</h2>
          <div class="when">
            <label class="radio">
              <input type="radio" name="when" value="now" bind:group={when} />
              <span>Send now</span>
            </label>
            <label class="radio">
              <input type="radio" name="when" value="schedule" bind:group={when} />
              <span>Schedule</span>
            </label>
          </div>
          {#if when === 'schedule'}
            <input type="datetime-local" bind:value={scheduledFor} />
          {/if}
        </section>
      </main>

      <aside class="preview">
        <span class="prev-label">Preview</span>
        <div class="card prev-card">
          <div class="prev-head">
            <span class="from">Common Good · <em>noreply@commongood.earth</em></span>
            <span class="to">To: {selectedAudience?.label}</span>
          </div>
          <div class="prev-subject">{subject || '(no subject yet)'}</div>
          <div class="prev-body">{body || 'Your message will appear here.'}</div>
          <div class="prev-foot">— The Common Good team</div>
        </div>
      </aside>
    </div>
  {/if}
</div>

<style>
  .container { max-width: 1200px; margin: 0 auto; padding: 1.5rem 1.75rem 3rem; }
  .crumbs { font-size: 0.85rem; color: var(--cg-text-muted); margin-bottom: 1rem; }
  .crumbs a { color: var(--cg-green); }
  .crumbs span { margin: 0 0.5rem; }

  .layout { display: grid; grid-template-columns: 1fr 380px; gap: 1.5rem; align-items: flex-start; }
  @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }

  header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.25rem; gap: 1rem; }
  header h1 { margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.01em; }
  .actions { display: flex; gap: 0.5rem; }
  .ghost { padding: 0.55rem 1rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.88rem; cursor: pointer; color: var(--cg-text); }
  .ghost:hover { border-color: var(--cg-green); }
  .primary { padding: 0.55rem 1.25rem; background: var(--cg-green); color: white; border: none; border-radius: var(--cg-radius-sm); font-size: 0.88rem; font-weight: 500; cursor: pointer; }
  .primary:hover:not(:disabled) { background: var(--cg-green-hover); }
  .primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .form { display: grid; gap: 1rem; }
  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); padding: 1.1rem 1.25rem; }
  .card h2 { margin: 0 0 0.7rem; font-size: 0.85rem; font-weight: 600; color: var(--cg-text); }

  .templates { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .t { padding: 0.45rem 0.85rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.85rem; cursor: pointer; color: var(--cg-text); }
  .t.selected { border-color: var(--cg-green); color: var(--cg-green); background: rgba(30,122,58,0.05); }
  .t:hover { border-color: var(--cg-green); }

  input[type='text'], input[type='datetime-local'], select, textarea { width: 100%; padding: 0.6rem 0.85rem; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); background: var(--cg-surface); color: var(--cg-text); font-family: inherit; font-size: 0.95rem; }
  textarea { resize: vertical; line-height: 1.5; }
  input:focus, select:focus, textarea:focus { outline: none; border-color: var(--cg-green); box-shadow: 0 0 0 3px var(--cg-green-soft); }

  .when { display: flex; gap: 1.25rem; margin-bottom: 0.85rem; }
  .radio { display: inline-flex; align-items: center; gap: 0.45rem; cursor: pointer; font-size: 0.92rem; }
  .radio input { accent-color: var(--cg-green); }

  .preview { display: grid; gap: 0.5rem; }
  .prev-label { font-size: 0.72rem; color: var(--cg-text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
  .prev-card { padding: 1.25rem; }
  .prev-head { display: grid; gap: 0.2rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--cg-border); margin-bottom: 0.85rem; font-size: 0.78rem; color: var(--cg-text-muted); }
  .from em { font-style: normal; }
  .to { font-weight: 500; }
  .prev-subject { font-weight: 600; font-size: 1.05rem; color: var(--cg-text); margin-bottom: 0.75rem; }
  .prev-body { font-size: 0.92rem; color: var(--cg-text); white-space: pre-wrap; line-height: 1.5; min-height: 6rem; }
  .prev-foot { margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--cg-border); font-size: 0.82rem; color: var(--cg-text-muted); }

  .sent { display: grid; place-items: center; gap: 0.5rem; padding: 3rem 1.5rem; text-align: center; }
  .check { width: 4.5rem; height: 4.5rem; border-radius: 50%; background: rgba(30,122,58,0.1); color: var(--cg-green); display: grid; place-items: center; margin-bottom: 0.75rem; }
  .sent h2 { margin: 0; font-size: 1.25rem; font-weight: 600; }
  .sent p { margin: 0; color: var(--cg-text-muted); }
</style>
