<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'
  import { goto } from '$app/navigation'

  type Category = 'Financial' | 'Sponsorship' | 'Activity' | 'Compliance'

  let step = $state<1 | 2 | 3>(1)

  // Step 1 — choose a starting point
  let category = $state<Category | ''>('')
  let name = $state('')

  // Step 2 — pick columns
  const columnsByCategory: Record<Category, string[]> = {
    Financial:    ['Date', 'Donor', 'Organization', 'Expected amount', 'Received amount', 'Payment type', 'Status', 'Variance'],
    Sponsorship:  ['Organization', 'Status', 'Sponsored since', 'Primary contact', 'Grants YTD', 'Last activity'],
    Activity:     ['Date', 'Member', 'Organization', 'Action', 'IP address', 'Result'],
    Compliance:   ['Organization', 'State', 'Filing type', 'Due date', 'Status', 'Last filed']
  }
  let selectedColumns = $state<Record<string, boolean>>({})
  $effect(() => {
    if (category) {
      selectedColumns = Object.fromEntries(columnsByCategory[category].map(c => [c, true]))
    }
  })
  const columns = $derived(category ? columnsByCategory[category] : [])

  // Step 3 — filters + delivery
  let range = $state<'30d' | 'ytd' | 'last-q' | 'custom'>('ytd')
  let format = $state<'csv' | 'pdf' | 'xlsx'>('csv')
  let recurring = $state(false)
  let cadence = $state<'weekly' | 'monthly' | 'quarterly'>('monthly')

  let done = $state(false)

  const canNext = $derived.by(() => {
    if (step === 1) return !!category && name.trim().length > 0
    if (step === 2) return Object.values(selectedColumns).some(v => v)
    return true
  })

  function next() {
    if (!canNext) return
    if (step === 3) {
      done = true
      setTimeout(() => goto('/preview/admin/reports'), 1800)
      return
    }
    step = (step + 1) as 1 | 2 | 3
  }
  function back() { if (step > 1) step = (step - 1) as 1 | 2 | 3 }
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/admin">Admin</a> <span>›</span>
    <a href="/preview/admin/reports">Reports</a> <span>›</span>
    <span>Build report</span>
  </nav>

  {#if done}
    <div class="card finished">
      <div class="check"><Icon name="check" size={28} /></div>
      <h2>{recurring ? 'Recurring report scheduled' : 'Report generated'}</h2>
      <p>"{name}" — {recurring ? `runs ${cadence}` : 'available now'} as {format.toUpperCase()}.</p>
    </div>
  {:else}
    <header>
      <h1>Build a report</h1>
      <p>Pick a starting point, choose columns, set filters and delivery.</p>
    </header>

    <ol class="stepper">
      <li class:current={step === 1} class:done={step > 1}>
        <span class="step-num">1</span>
        <span class="step-label">Choose category</span>
      </li>
      <li class:current={step === 2} class:done={step > 2}>
        <span class="step-num">2</span>
        <span class="step-label">Pick columns</span>
      </li>
      <li class:current={step === 3}>
        <span class="step-num">3</span>
        <span class="step-label">Filters &amp; delivery</span>
      </li>
    </ol>

    <div class="card content">
      {#if step === 1}
        <h2>Choose a category</h2>
        <div class="cats">
          {#each ['Financial','Sponsorship','Activity','Compliance'] as c}
            <button
              class="cat"
              class:selected={category === c}
              onclick={() => (category = c as Category)}
            >
              <Icon name={c === 'Financial' ? 'download' : c === 'Sponsorship' ? 'user' : c === 'Activity' ? 'chat' : 'shield'} size={20} />
              <span class="cat-label">{c}</span>
            </button>
          {/each}
        </div>

        <h2 class="sub">Name this report</h2>
        <input type="text" placeholder="e.g., June grants — by donor" bind:value={name} maxlength="80" />
      {/if}

      {#if step === 2}
        <h2>Pick columns for the report</h2>
        <p class="muted">All selected by default. Uncheck what you don't need.</p>
        <ul class="cols">
          {#each columns as c}
            <li>
              <label>
                <input type="checkbox" bind:checked={selectedColumns[c]} />
                <span>{c}</span>
              </label>
            </li>
          {/each}
        </ul>
      {/if}

      {#if step === 3}
        <h2>Filters</h2>
        <div class="row">
          <label>
            <span class="lbl">Date range</span>
            <select bind:value={range}>
              <option value="30d">Last 30 days</option>
              <option value="ytd">Year to date</option>
              <option value="last-q">Last quarter</option>
              <option value="custom">Custom…</option>
            </select>
          </label>
        </div>

        <h2 class="sub">Delivery</h2>
        <div class="row">
          <label>
            <span class="lbl">Format</span>
            <select bind:value={format}>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
        </div>

        <label class="recur">
          <input type="checkbox" bind:checked={recurring} />
          <span>Schedule as recurring</span>
        </label>
        {#if recurring}
          <div class="row">
            <label>
              <span class="lbl">Cadence</span>
              <select bind:value={cadence}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </label>
          </div>
        {/if}
      {/if}
    </div>

    <div class="foot">
      <button class="ghost" onclick={back} disabled={step === 1}>← Back</button>
      <button class="primary" disabled={!canNext} onclick={next}>
        {step === 3 ? (recurring ? 'Schedule report' : 'Generate now') : 'Next →'}
      </button>
    </div>
  {/if}
</div>

<style>
  .container { max-width: 820px; margin: 0 auto; padding: 1.5rem 1.75rem 3rem; }
  .crumbs { font-size: 0.85rem; color: var(--cg-text-muted); margin-bottom: 1rem; }
  .crumbs a { color: var(--cg-green); }
  .crumbs span { margin: 0 0.5rem; }

  header { margin-bottom: 1.25rem; }
  header h1 { margin: 0 0 0.25rem; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.01em; }
  header p { margin: 0; color: var(--cg-text-muted); font-size: 0.9rem; }

  .stepper { list-style: none; padding: 0; margin: 0 0 1.25rem; display: flex; gap: 0.85rem; align-items: center; }
  .stepper li { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.85rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: 999px; font-size: 0.85rem; color: var(--cg-text-muted); }
  .stepper li.current { border-color: var(--cg-green); color: var(--cg-green); }
  .stepper li.done { color: var(--cg-text); }
  .stepper li.done .step-num { background: var(--cg-green); color: white; border-color: var(--cg-green); }
  .step-num { width: 1.5rem; height: 1.5rem; border-radius: 50%; background: var(--cg-bg); border: 1px solid var(--cg-border); display: grid; place-items: center; font-weight: 600; font-size: 0.78rem; }
  .stepper li.current .step-num { background: var(--cg-green); color: white; border-color: var(--cg-green); }
  .step-label { font-weight: 500; }

  .card { background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius); }
  .content { padding: 1.5rem; }
  .content h2 { margin: 0 0 0.85rem; font-size: 0.95rem; font-weight: 600; }
  .content h2.sub { margin-top: 1.5rem; }
  .muted { color: var(--cg-text-muted); font-size: 0.88rem; margin: 0 0 0.85rem; }

  .cats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .cat { display: flex; align-items: center; gap: 0.85rem; padding: 1rem 1.1rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); cursor: pointer; color: var(--cg-text); font-family: inherit; }
  .cat:hover { border-color: var(--cg-green); }
  .cat.selected { border-color: var(--cg-green); background: rgba(30,122,58,0.05); color: var(--cg-green); }
  .cat-label { font-weight: 600; font-size: 0.95rem; }

  input[type='text'], select { width: 100%; padding: 0.6rem 0.85rem; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); background: var(--cg-surface); color: var(--cg-text); font-family: inherit; font-size: 0.95rem; }
  input:focus, select:focus { outline: none; border-color: var(--cg-green); box-shadow: 0 0 0 3px var(--cg-green-soft); }

  .cols { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.4rem; }
  .cols label { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); cursor: pointer; font-size: 0.9rem; }
  .cols label:hover { border-color: var(--cg-green); }
  .cols input { accent-color: var(--cg-green); }

  .row { margin-bottom: 1rem; }
  .row .lbl { display: block; font-size: 0.82rem; color: var(--cg-text); font-weight: 500; margin-bottom: 0.35rem; }
  .recur { display: inline-flex; gap: 0.5rem; align-items: center; padding: 0.5rem 0; cursor: pointer; font-size: 0.9rem; }
  .recur input { accent-color: var(--cg-green); }

  .foot { display: flex; justify-content: space-between; margin-top: 1.25rem; }
  .ghost { padding: 0.55rem 1rem; background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm); font-size: 0.88rem; cursor: pointer; color: var(--cg-text); }
  .ghost:hover:not(:disabled) { border-color: var(--cg-green); }
  .ghost:disabled { opacity: 0.5; cursor: not-allowed; }
  .primary { padding: 0.55rem 1.25rem; background: var(--cg-green); color: white; border: none; border-radius: var(--cg-radius-sm); font-size: 0.88rem; font-weight: 500; cursor: pointer; }
  .primary:hover:not(:disabled) { background: var(--cg-green-hover); }
  .primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .finished { display: grid; place-items: center; gap: 0.5rem; padding: 3rem 1.5rem; text-align: center; }
  .check { width: 4.5rem; height: 4.5rem; border-radius: 50%; background: rgba(30,122,58,0.1); color: var(--cg-green); display: grid; place-items: center; margin-bottom: 0.75rem; }
  .finished h2 { margin: 0; font-size: 1.25rem; font-weight: 600; }
  .finished p { margin: 0; color: var(--cg-text-muted); }
</style>
