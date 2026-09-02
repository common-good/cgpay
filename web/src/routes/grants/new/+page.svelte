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

  // Check-specific fields (per William 2026-08-04): only required when by === 'check'.
  let ckNum = $state('')
  let ckDate = $state('')

  // Grant agreement PDF - only shown when amount > $5k (Phase 3.5 PR B).
  // Optional at submit time (sponsee may not have signed agreement yet); admin can attach later.
  let agreementFile = $state<File | null>(null)
  const UNDOC_GRANT_MAX = 5000

  // Grantor autocomplete state (Phase 3.5 PR A follow-up):
  //   - suggestions: current dropdown items
  //   - suggestOpen: whether the dropdown is showing
  //   - grantorPid: id from a picked existing grantor (cleared when user edits the name)
  //   - suggestIndex: keyboard-highlighted row index (-1 = none)
  type Person = { pid: number; fullName: string; email: string; phone: string; address: string; city: string; state: number | null; zip: string }
  let suggestions = $state<Person[]>([])
  let suggestOpen = $state(false)
  let grantorPid = $state<number | null>(null)
  let suggestIndex = $state(-1)
  let suggestTimer: ReturnType<typeof setTimeout> | null = null

  async function fetchSuggestions(q: string) {
    const token = localStorage.getItem('cg_token')
    if (!token) return
    try {
      const res = await fetch(`/api/people-autocomplete?q=${encodeURIComponent(q)}`, {
        headers: { authorization: `Bearer ${token}` }
      })
      if (!res.ok) { suggestions = []; return }
      const data = await res.json()
      suggestions = Array.isArray(data.people) ? data.people : []
      suggestOpen = suggestions.length > 0
      suggestIndex = -1
    } catch {
      suggestions = []
    }
  }

  function onGrantorInput(e: Event) {
    const val = (e.currentTarget as HTMLInputElement).value
    fullName = val
    // Any manual edit clears a previously-picked pid - PHP treats a name change
    // after selection as a new entity (per William's people-table edit rules).
    grantorPid = null
    if (suggestTimer) clearTimeout(suggestTimer)
    if (val.trim().length < 2) {
      suggestions = []
      suggestOpen = false
      return
    }
    suggestTimer = setTimeout(() => fetchSuggestions(val.trim()), 200)
  }

  function pickSuggestion(p: Person) {
    fullName = p.fullName
    grantorPid = p.pid
    if (p.email) email = p.email
    if (p.phone) phone = p.phone
    if (p.address) address = p.address
    if (p.city) city = p.city
    if (p.state != null) stateCode = String(p.state)
    if (p.zip) zip = p.zip
    suggestOpen = false
    suggestions = []
  }

  function onGrantorKeydown(e: KeyboardEvent) {
    if (!suggestOpen || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); suggestIndex = Math.min(suggestions.length - 1, suggestIndex + 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); suggestIndex = Math.max(-1, suggestIndex - 1) }
    else if (e.key === 'Enter' && suggestIndex >= 0) { e.preventDefault(); pickSuggestion(suggestions[suggestIndex]) }
    else if (e.key === 'Escape') { suggestOpen = false }
  }

  function onGrantorBlur() {
    // Close after a beat so a click on a suggestion lands first.
    setTimeout(() => { suggestOpen = false }, 150)
  }

  let submitting = $state(false)
  let error = $state<string | null>(null)
  // Per-field validation errors from the server. Cleared on each submit attempt.
  let fieldErrors = $state<Record<string, string>>({})

  const amountNum = $derived(Number(amount.replace(/[$,\s]/g, '')))
  const showAgreementUpload = $derived(Number.isFinite(amountNum) && amountNum > UNDOC_GRANT_MAX)
  const stateNum = $derived(Number(stateCode))
  const canSubmit = $derived(
    !submitting
    && fullName.trim().length > 0
    && Number.isFinite(amountNum) && amountNum > 0
    && address.trim().length > 0
    && city.trim().length > 0
    && stateCode.trim().length > 0 && Number.isFinite(stateNum) && stateNum > 0
    && zip.trim().length > 0
    && (by !== 'check' || (ckNum.trim().length > 0 && ckDate.trim().length > 0))
  )

  async function submit() {
    if (!canSubmit) return
    submitting = true
    error = null
    fieldErrors = {}

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
    if (by === 'check') {
      payload.ckNum = ckNum.trim()
      payload.ckDate = ckDate.trim()
    }
    if (grantorPid != null) {
      payload.grantorPid = grantorPid
    }

    // When an agreement file is attached, submit as multipart/form-data.
    // Otherwise stick with JSON (matches existing test coverage).
    let fetchInit: RequestInit
    if (agreementFile) {
      const form = new FormData()
      for (const [k, v] of Object.entries(payload)) form.append(k, String(v))
      form.append('agreement', agreementFile, agreementFile.name)
      fetchInit = {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` }, // let the browser set content-type + boundary
        body: form
      }
    } else {
      fetchInit = {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      }
    }

    try {
      const res = await fetch('/api/grants', fetchInit)
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
        // Server returns { message, errors: { fieldName: "…" } } for validation failures.
        if (body && typeof body.errors === 'object' && body.errors) {
          fieldErrors = body.errors as Record<string, string>
        }
        error = body?.message ?? body?.error ?? `Could not save the grant (${res.status})`
        submitting = false
        return
      }
      await goto('/grants')
    } catch {
      error = 'Network error — please try again.'
      submitting = false
    }
  }

  // Helper for cleaner template — returns the field-error message or '' (falsy).
  function fe(name: string): string {
    return fieldErrors[name] ?? ''
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

      <form class="form-card" onsubmit={(e) => { e.preventDefault(); submit() }} novalidate>
        <fieldset>
          <legend>Grant details</legend>
          <div class="grid-2">
            <div class="field span-2" class:has-err={fe('fullName')}>
              <label for="grantor">Grantor Name <span class="req">*</span></label>
              <div class="autocomplete">
                <input id="grantor" type="text" value={fullName}
                  oninput={onGrantorInput}
                  onkeydown={onGrantorKeydown}
                  onblur={onGrantorBlur}
                  onfocus={() => { if (suggestions.length > 0) suggestOpen = true }}
                  placeholder="Full name of donor / funder"
                  autocomplete="off"
                  aria-autocomplete="list"
                  aria-expanded={suggestOpen}
                  aria-invalid={!!fe('fullName')} />
                {#if suggestOpen && suggestions.length > 0}
                  <ul class="suggest-list" role="listbox">
                    {#each suggestions as p, i}
                      <li role="option" aria-selected={i === suggestIndex} class:active={i === suggestIndex}
                        onmousedown={(e) => { e.preventDefault(); pickSuggestion(p) }}>
                        <span class="suggest-name">{p.fullName}</span>
                        {#if p.city || p.zip}
                          <span class="suggest-meta">{[p.city, p.zip].filter(Boolean).join(' • ')}</span>
                        {/if}
                      </li>
                    {/each}
                  </ul>
                {/if}
              </div>
              {#if fe('fullName')}<span class="field-err">{fe('fullName')}</span>{/if}
            </div>

            <div class="field" class:has-err={fe('amount')}>
              <label for="amount">Expected Amount <span class="req">*</span></label>
              <div class="input-wrap"><span class="prefix">$</span><input id="amount" type="text" inputmode="decimal" bind:value={amount} placeholder="25,000.00" aria-invalid={!!fe('amount')} /></div>
              {#if fe('amount')}<span class="field-err">{fe('amount')}</span>{/if}
            </div>

            <div class="field" class:has-err={fe('by')}>
              <label for="by">Payment Method <span class="req">*</span></label>
              <select id="by" bind:value={by} aria-invalid={!!fe('by')}>
                <option value="ach">ACH</option>
                <option value="check">Check</option>
                <option value="wire">Wire</option>
              </select>
              {#if fe('by')}<span class="field-err">{fe('by')}</span>{/if}
            </div>

            {#if by === 'check'}
              <div class="field" class:has-err={fe('ckNum')}>
                <label for="ckNum">Check Number <span class="req">*</span></label>
                <input id="ckNum" type="text" bind:value={ckNum} placeholder="e.g. 1234" autocomplete="off" aria-invalid={!!fe('ckNum')} />
                {#if fe('ckNum')}<span class="field-err">{fe('ckNum')}</span>{/if}
              </div>
              <div class="field" class:has-err={fe('ckDate')}>
                <label for="ckDate">Check Date <span class="req">*</span></label>
                <input id="ckDate" type="date" bind:value={ckDate} autocomplete="off" aria-invalid={!!fe('ckDate')} />
                {#if fe('ckDate')}<span class="field-err">{fe('ckDate')}</span>{/if}
              </div>
            {/if}

            {#if showAgreementUpload}
              <div class="field span-2" class:has-err={fe('agreement')}>
                <label for="agreement">Grant Agreement <span class="opt">(PDF, optional)</span></label>
                <input id="agreement" type="file" accept="application/pdf,image/*"
                  onchange={(e) => { agreementFile = (e.currentTarget as HTMLInputElement).files?.[0] ?? null }}
                  aria-invalid={!!fe('agreement')} />
                <span class="hint">For grants over ${UNDOC_GRANT_MAX.toLocaleString()}, please attach the signed agreement if you have it. You can also send it later - an admin will file it when the funds arrive.</span>
                {#if fe('agreement')}<span class="field-err">{fe('agreement')}</span>{/if}
              </div>
            {/if}
          </div>
        </fieldset>

        <fieldset>
          <legend>Grantor Contact Information</legend>
          <div class="grid-2">
            <div class="field span-2" class:has-err={fe('address')}>
              <label for="address">Street Address <span class="req">*</span></label>
              <input id="address" type="text" bind:value={address} autocomplete="off" aria-invalid={!!fe('address')} />
              {#if fe('address')}<span class="field-err">{fe('address')}</span>{/if}
            </div>
            <div class="field" class:has-err={fe('city')}>
              <label for="city">City <span class="req">*</span></label>
              <input id="city" type="text" bind:value={city} autocomplete="off" aria-invalid={!!fe('city')} />
              {#if fe('city')}<span class="field-err">{fe('city')}</span>{/if}
            </div>
            <div class="field" class:has-err={fe('state')}>
              <label for="state">State <span class="req">*</span></label>
              <input id="state" type="text" bind:value={stateCode} placeholder="State id" autocomplete="off" aria-invalid={!!fe('state')} />
              {#if fe('state')}<span class="field-err">{fe('state')}</span>{/if}
            </div>
            <div class="field" class:has-err={fe('zip')}>
              <label for="zip">ZIP <span class="req">*</span></label>
              <input id="zip" type="text" bind:value={zip} autocomplete="off" aria-invalid={!!fe('zip')} />
              {#if fe('zip')}<span class="field-err">{fe('zip')}</span>{/if}
            </div>
            <div class="field" class:has-err={fe('email')}>
              <label for="email">Email <span class="opt">(optional)</span></label>
              <input id="email" type="email" bind:value={email} autocomplete="off" aria-invalid={!!fe('email')} />
              {#if fe('email')}<span class="field-err">{fe('email')}</span>{/if}
            </div>
            <div class="field" class:has-err={fe('phone')}>
              <label for="phone">Phone <span class="opt">(optional)</span></label>
              <input id="phone" type="tel" bind:value={phone} autocomplete="off" aria-invalid={!!fe('phone')} />
              {#if fe('phone')}<span class="field-err">{fe('phone')}</span>{/if}
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
  .hint { display: block; font-size: 0.8rem; color: var(--cg-text-muted); margin-top: 0.35rem; line-height: 1.4; }
  .req { color: #b91c1c; margin-left: 0.15rem; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; }
  .field label { font-size: 0.85rem; font-weight: 500; color: var(--cg-text); }
  .field input, .field select {
    width: 100%; padding: 0.55rem 0.75rem; box-sizing: border-box;
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    font-size: 0.95rem; background: white; color: var(--cg-text);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .field input:focus, .field select:focus {
    outline: none;
    border-color: var(--cg-green);
    box-shadow: 0 0 0 3px rgba(30, 122, 58, 0.15);
  }
  .field.span-2 { grid-column: span 2; }
  @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } .field.span-2 { grid-column: auto; } }

  .input-wrap {
    display: flex; align-items: center; gap: 0.5rem;
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    padding-left: 0.75rem; background: white;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .input-wrap input { border: 0; padding: 0.55rem 0.5rem; }
  .input-wrap input:focus { box-shadow: none; }
  .input-wrap .prefix { color: var(--cg-text-muted); }

  /* Grantor autocomplete */
  .autocomplete { position: relative; }
  .suggest-list {
    position: absolute; top: 100%; left: 0; right: 0; z-index: 20;
    list-style: none; margin: 0.25rem 0 0; padding: 0.25rem 0;
    background: white; border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm); box-shadow: var(--cg-shadow);
    max-height: 220px; overflow-y: auto;
  }
  .suggest-list li {
    padding: 0.5rem 0.8rem; cursor: pointer;
    display: flex; flex-direction: column; gap: 0.1rem;
    font-size: 0.9rem;
  }
  .suggest-list li:hover, .suggest-list li.active {
    background: var(--cg-green-soft);
  }
  .suggest-name { color: var(--cg-text); font-weight: 500; }
  .suggest-meta { color: var(--cg-text-muted); font-size: 0.8rem; }

  /* Field-error highlighting */
  .field.has-err input,
  .field.has-err select {
    border-color: #b91c1c;
    background: #fef2f2;
  }
  .field.has-err .input-wrap {
    border-color: #b91c1c;
    background: #fef2f2;
  }
  .field.has-err label {
    color: #991b1b;
  }
  .field-err {
    color: #991b1b;
    font-size: 0.8rem;
    margin-top: 0.15rem;
  }

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
