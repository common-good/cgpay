<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import Icon from '$lib/components/Icon.svelte'

  onMount(() => {
    if (!localStorage.getItem('cg_token')) goto('/login')
  })

  let fullName = $state('')
  let amount = $state('')
  let by = $state<'ach' | 'check' | 'wire'>('ach')

  let email = $state('')
  let phone = $state('')
  let address = $state('')
  let city = $state('')
  let stateCode = $state('')
  let zip = $state('')

  let submitting = $state(false)
  let error = $state<string | null>(null)

  const amountNum = $derived(Number(amount.replace(/[$,\s]/g, '')))
  const canSubmit = $derived(
    !submitting && fullName.trim().length > 0 && Number.isFinite(amountNum) && amountNum > 0
  )

  async function submit() {
    if (!canSubmit) return
    submitting = true
    error = null

    const token = localStorage.getItem('cg_token')
    if (!token) {
      await goto('/login')
      return
    }

    const payload: Record<string, unknown> = {
      fullName: fullName.trim(),
      amount: amountNum,
      by
    }
    for (const [k, v] of Object.entries({ email, phone, address, city, zip })) {
      if (v.trim()) payload[k] = v.trim()
    }
    if (stateCode.trim() && Number.isFinite(Number(stateCode))) {
      payload.state = Number(stateCode)
    }

    try {
      const res = await fetch('/api/grants', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      if (res.status === 401) {
        localStorage.removeItem('cg_token')
        await goto('/login')
        return
      }
      if (res.status === 403) {
        error = 'Reporting expected grants is available only to fiscally sponsored partners.'
        submitting = false
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        error = body.message ?? `Could not save the grant (${res.status})`
        submitting = false
        return
      }
      await goto('/grants')
    } catch {
      error = 'Network error — please try again.'
      submitting = false
    }
  }
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/">Dashboard</a> <span>›</span>
    <a href="/grants">Expected Grants</a> <span>›</span>
    <span>Report Expected Grant</span>
  </nav>

  <div class="layout">
    <aside class="side">
      <div class="help card">
        <Icon name="help" size={18} class="help-icon" />
        <div>
          <strong>Need help?</strong>
          <p>Fill in as much as you know about the grantor. We'll match the funds when they arrive.</p>
        </div>
      </div>
    </aside>

    <section class="form-area">
      <div class="header-row">
        <div>
          <h1>Report Expected Grant</h1>
          <p>Let us know about an incoming grant so we can match and process it quickly.</p>
        </div>
      </div>

      {#if error}
        <div class="err" role="alert">{error}</div>
      {/if}

      <form class="form-card" onsubmit={(e) => { e.preventDefault(); submit() }}>
        <fieldset>
          <legend>Grant details</legend>
          <div class="grid-2">
            <div class="field span-2">
              <label for="grantor">Grantor Name <span class="req">*</span></label>
              <input id="grantor" type="text" bind:value={fullName} placeholder="Full name of donor / funder" autocomplete="off" required />
            </div>

            <div class="field">
              <label for="amount">Expected Amount <span class="req">*</span></label>
              <div class="input-wrap"><span class="prefix">$</span><input id="amount" type="text" inputmode="decimal" bind:value={amount} placeholder="25,000.00" required /></div>
            </div>

            <div class="field">
              <label for="by">Payment Method <span class="req">*</span></label>
              <select id="by" bind:value={by}>
                <option value="ach">ACH</option>
                <option value="check">Check</option>
                <option value="wire">Wire</option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Grantor contact <span class="opt">(optional — helps us match faster)</span></legend>
          <div class="grid-2">
            <div class="field">
              <label for="email">Email</label>
              <input id="email" type="email" bind:value={email} autocomplete="off" />
            </div>
            <div class="field">
              <label for="phone">Phone</label>
              <input id="phone" type="tel" bind:value={phone} autocomplete="off" />
            </div>
            <div class="field span-2">
              <label for="address">Street address</label>
              <input id="address" type="text" bind:value={address} autocomplete="off" />
            </div>
            <div class="field">
              <label for="city">City</label>
              <input id="city" type="text" bind:value={city} autocomplete="off" />
            </div>
            <div class="field">
              <label for="state">State</label>
              <input id="state" type="text" bind:value={stateCode} placeholder="State id" autocomplete="off" />
            </div>
            <div class="field">
              <label for="zip">ZIP</label>
              <input id="zip" type="text" bind:value={zip} autocomplete="off" />
            </div>
          </div>
        </fieldset>

        <div class="form-footer">
          <a class="ghost" href="/grants">Cancel</a>
          <button class="primary" type="submit" disabled={!canSubmit}>
            {submitting ? 'Saving…' : 'Report Grant'}
          </button>
        </div>
      </form>
    </section>
  </div>
</div>

<style>
  .container { max-width: 1280px; margin: 0 auto; padding: 1.5rem 1.75rem 3rem; }
  .crumbs { font-size: 0.85rem; color: var(--cg-text-muted); margin-bottom: 1.5rem; }
  .crumbs a { color: var(--cg-green); }
  .crumbs span { margin: 0 0.5rem; }

  .layout { display: grid; grid-template-columns: 260px 1fr; gap: 1.5rem; align-items: flex-start; }
  @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }

  .help {
    padding: 1.1rem; background: var(--cg-surface); border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius); display: flex; gap: 0.75rem;
  }
  :global(.help-icon) { color: var(--cg-green); flex-shrink: 0; margin-top: 0.15rem; }
  .help strong { font-weight: 600; font-size: 0.9rem; }
  .help p { margin: 0.25rem 0 0; font-size: 0.82rem; color: var(--cg-text-muted); }

  .form-area { display: grid; gap: 1.25rem; }

  .header-row h1 { margin: 0 0 0.2rem; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.01em; }
  .header-row p { margin: 0; color: var(--cg-text-muted); font-size: 0.9rem; }

  .err {
    padding: 0.8rem 1rem; border-radius: var(--cg-radius-sm);
    background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; font-size: 0.9rem;
  }

  .form-card {
    background: var(--cg-surface); border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius); padding: 1.5rem;
    display: grid; gap: 1.5rem;
  }
  .form-card fieldset { border: 0; padding: 0; margin: 0; }
  .form-card legend { font-weight: 600; margin-bottom: 0.75rem; font-size: 0.95rem; }
  .opt { font-weight: 400; color: var(--cg-text-muted); font-size: 0.85rem; }
  .req { color: #b91c1c; margin-left: 0.15rem; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; }
  .field label { font-size: 0.85rem; font-weight: 500; color: var(--cg-text); }
  .field input, .field select {
    width: 100%; padding: 0.55rem 0.75rem; box-sizing: border-box;
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    font-size: 0.95rem; background: white; color: var(--cg-text);
  }
  .field.span-2 { grid-column: span 2; }
  @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } .field.span-2 { grid-column: auto; } }

  .input-wrap {
    display: flex; align-items: center; gap: 0.5rem;
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    padding-left: 0.75rem; background: white;
  }
  .input-wrap input { border: 0; padding: 0.55rem 0.5rem; }
  .input-wrap .prefix { color: var(--cg-text-muted); }

  .form-footer {
    display: flex; justify-content: flex-end; gap: 0.5rem;
    padding-top: 0.5rem; border-top: 1px solid var(--cg-border);
    margin-top: 0.5rem; padding-top: 1rem;
  }
  .ghost {
    padding: 0.55rem 0.95rem; background: var(--cg-surface);
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    font-size: 0.88rem; cursor: pointer; color: var(--cg-text); text-decoration: none;
    display: inline-flex; align-items: center;
  }
  .primary {
    padding: 0.55rem 1.05rem; background: var(--cg-green); color: white; border: 0;
    border-radius: var(--cg-radius-sm); font-size: 0.9rem; font-weight: 500; cursor: pointer;
  }
  .primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
