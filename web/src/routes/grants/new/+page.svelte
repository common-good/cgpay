<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'

  // No client-side auth check here - +layout.server.ts fails 401 for anonymous
  // callers to /api/grants below, at which point we redirect.

  let { data } = $props()

  let fullName = $state('')
  let amount = $state('')
  let by = $state<'ach' | 'check' | 'wire'>('ach')

  let email = $state('')
  let phone = $state('')
  let address = $state('')
  let city = $state('')
  let stateCode = $state('')
  let zip = $state('')

  // Check-specific fields are admin-only (per William 2026-10-09, cgpay #180).
  // A sponsee reporting an expected check grant doesn't have the check number
  // or date yet - the admin fills them in when the check arrives. The form
  // hides these inputs for non-admin callers; PHP's cgpayGrantsParseFlds no
  // longer requires them for check-type grants.
  const isAdmin = $derived(!!data.user?.admin)
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
    try {
      const res = await fetch(`/api/people-autocomplete?q=${encodeURIComponent(q)}`)
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
    && (by !== 'check' || !isAdmin || (ckNum.trim().length > 0 && ckDate.trim().length > 0))
  )
  // Mirrors canSubmit so a disabled button says why.
  const missing = $derived([
    !fullName.trim() && 'grantor name',
    !(Number.isFinite(amountNum) && amountNum > 0) && 'amount',
    by === 'check' && isAdmin && !ckNum.trim() && 'check number',
    by === 'check' && isAdmin && !ckDate.trim() && 'check date',
    !address.trim() && 'street address',
    !city.trim() && 'city',
    !(Number.isFinite(stateNum) && stateNum > 0) && 'state',
    !zip.trim() && 'ZIP',
  ].filter(Boolean))

  async function submit() {
    if (!canSubmit) return
    submitting = true
    error = null
    fieldErrors = {}

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
    if (by === 'check' && isAdmin) {
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
        body: form // browser sets content-type + boundary
      }
    } else {
      fetchInit = {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      }
    }

    try {
      const res = await fetch('/api/grants', fetchInit)
      if (res.status === 401) {
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

<main class="container">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/">Dashboard</a> <span aria-hidden="true">/</span>
    <a href="/grants">Expected Grants</a> <span aria-hidden="true">/</span>
    <span>Report</span>
  </nav>

  <section class="form-area">
    <div class="page-head">
      <h1>Report Expected Grant</h1>
      <p>Let us know about an incoming grant so we can match and process it quickly. Fill in as much as you know about the grantor; we'll match the funds when they arrive.</p>
    </div>

    {#if error}
      <div class="alert alert-error" role="alert">{error}</div>
    {/if}

    <form class="form-card" onsubmit={(e) => { e.preventDefault(); submit() }} novalidate>
      <fieldset>
        <legend>Grant details</legend>
        <div class="grid-2">
          <div class="field span-2" class:has-err={fe('fullName')}>
            <label for="grantor">Grantor Name <span class="req">*</span></label>
            <div class="autocomplete">
              <input id="grantor" data-testid="grantor" type="text" value={fullName}
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
                        <span class="suggest-meta">{[p.city, p.zip].filter(Boolean).join(' - ')}</span>
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
            <div class="input-wrap"><span class="prefix">$</span><input id="amount" data-testid="amount" type="text" inputmode="decimal" bind:value={amount} placeholder="25,000.00" aria-invalid={!!fe('amount')} /></div>
            {#if fe('amount')}<span class="field-err">{fe('amount')}</span>{/if}
          </div>

          <div class="field" class:has-err={fe('by')}>
            <label for="by">Payment Method <span class="req">*</span></label>
            <select id="by" data-testid="by" bind:value={by} aria-invalid={!!fe('by')}>
              <option value="ach">ACH</option>
              <option value="check">Check</option>
              <option value="wire">Wire</option>
            </select>
            {#if fe('by')}<span class="field-err">{fe('by')}</span>{/if}
          </div>

          {#if by === 'check' && isAdmin}
            <div class="field" class:has-err={fe('ckNum')}>
              <label for="ckNum">Check Number <span class="req">*</span></label>
              <input id="ckNum" data-testid="ckNum" type="text" bind:value={ckNum} placeholder="e.g. 1234" autocomplete="off" aria-invalid={!!fe('ckNum')} />
              {#if fe('ckNum')}<span class="field-err">{fe('ckNum')}</span>{/if}
            </div>
            <div class="field" class:has-err={fe('ckDate')}>
              <label for="ckDate">Check Date <span class="req">*</span></label>
              <input id="ckDate" data-testid="ckDate" type="date" bind:value={ckDate} autocomplete="off" aria-invalid={!!fe('ckDate')} />
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
            <input id="address" data-testid="address" type="text" bind:value={address} autocomplete="off" aria-invalid={!!fe('address')} />
            {#if fe('address')}<span class="field-err">{fe('address')}</span>{/if}
          </div>
          <div class="field" class:has-err={fe('city')}>
            <label for="city">City <span class="req">*</span></label>
            <input id="city" data-testid="city" type="text" bind:value={city} autocomplete="off" aria-invalid={!!fe('city')} />
            {#if fe('city')}<span class="field-err">{fe('city')}</span>{/if}
          </div>
          <div class="field" class:has-err={fe('state')}>
            <label for="state">State <span class="req">*</span></label>
            <select id="state" data-testid="state" bind:value={stateCode} aria-invalid={!!fe('state')}>
              <option value="">Select...</option>
              {#each data.states as s}
                <option value={String(s.id)}>{s.abbrev}</option>
              {/each}
            </select>
            {#if fe('state')}<span class="field-err">{fe('state')}</span>{/if}
          </div>
          <div class="field" class:has-err={fe('zip')}>
            <label for="zip">ZIP <span class="req">*</span></label>
            <input id="zip" data-testid="zip" type="text" bind:value={zip} autocomplete="off" aria-invalid={!!fe('zip')} />
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
        {#if !submitting && missing.length}
          <span class="submit-hint">Still needed: {missing.join(', ')}</span>
        {/if}
        <a class="btn btn-secondary" href="/grants">Cancel</a>
        <button class="btn btn-primary" type="submit" data-testid="btn-report" disabled={!canSubmit}>
          {submitting ? 'Saving...' : 'Report Grant'}
        </button>
      </div>
    </form>
  </section>
</main>

<style>
  .crumbs { font-size: var(--fs-sm); color: var(--cg-text-muted); margin-bottom: var(--sp-4); display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .form-area { display: grid; gap: var(--sp-4); max-width: 760px; }
  .form-area .page-head { margin: 0; }

  .form-card { display: grid; gap: var(--sp-6); padding: var(--sp-5); background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--r-md); box-shadow: var(--shadow-1); }
  .form-card fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
  .form-card legend { font-weight: 650; font-size: var(--fs-md); padding: 0; margin-bottom: var(--sp-4); }
  .opt { font-weight: 400; color: var(--cg-text-muted); }
  .hint { font-size: var(--fs-sm); color: var(--cg-text-muted); line-height: 1.4; }
  .req { color: var(--cg-error); margin-left: 2px; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-4); }
  .field.span-2 { grid-column: span 2; }
  .field.has-err > label { color: var(--cg-error); }
  input[type="file"] { font-size: var(--fs-sm); min-height: var(--tap); }

  .input-wrap { position: relative; }
  .input-wrap .prefix { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--cg-text-muted); pointer-events: none; }
  .input-wrap input { padding-left: 30px; }

  .autocomplete { position: relative; }
  .suggest-list {
    position: absolute; top: 100%; left: 0; right: 0; z-index: 20;
    list-style: none; margin: var(--sp-1) 0 0; padding: var(--sp-1) 0;
    background: var(--cg-surface); border: 1px solid var(--cg-border); border-radius: var(--r-sm); box-shadow: var(--shadow-2);
    max-height: 260px; overflow-y: auto; animation: cg-rise var(--dur) var(--ease-out);
  }
  .suggest-list li { display: grid; gap: 2px; min-height: var(--tap); padding: var(--sp-2) var(--sp-3); cursor: pointer; }
  .suggest-list li:hover, .suggest-list li.active { background: var(--cg-green-soft); }
  .suggest-name { font-weight: 500; }
  .suggest-meta { color: var(--cg-text-muted); font-size: var(--fs-sm); }

  .form-footer { display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap; gap: var(--sp-3); padding-top: var(--sp-4); border-top: 1px solid var(--cg-border); }
  .submit-hint { margin-right: auto; color: var(--cg-text-muted); font-size: var(--fs-sm); }

  /* Phones: one column, full-width buttons with the main action on top, nearest the thumb's reach after the last field. */
  @media (max-width: 639px) {
    .form-card { padding: var(--sp-4); gap: var(--sp-5); }
    .grid-2 { grid-template-columns: 1fr; }
    .field.span-2 { grid-column: auto; }
    .form-footer { flex-direction: column-reverse; align-items: stretch; }
    .submit-hint { margin: 0; text-align: center; }
  }
</style>
