<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'

  // Mock donor list for autocomplete UI
  const knownDonors = [
    'Verizon Foundation',
    'Community Foundation of Sonoma County',
    'CL+P Distribution',
    'Waverley Street Foundation',
    'Enterprise for Youth'
  ]

  let donorInput = $state('')
  let donorRecognized = $state(false)
  let amount = $state('')
  let expectedDate = $state('')
  let paymentType = $state('ACH')
  let programName = $state('')

  const filteredDonors = $derived(
    donorInput && !donorRecognized
      ? knownDonors.filter(d => d.toLowerCase().includes(donorInput.toLowerCase()))
      : []
  )

  function pickDonor(d: string) {
    donorInput = d
    donorRecognized = true
  }

  const allRequired = $derived(donorInput && amount && expectedDate && paymentType)

  const confirmations = [
    { id: 'banking', label: 'I confirm the donor has been provided current Common Good banking information.' },
    { id: 'accuracy', label: 'I confirm the expected amount and payment type are accurate.' },
    { id: 'delay',    label: 'I understand mismatched information may delay processing.' },
    { id: 'expected', label: 'I understand this is an expected grant and not a guarantee of receipt.' }
  ]
  let checked = $state<Record<string, boolean>>({})
</script>

<div class="container">
  <nav class="crumbs">
    <a href="/preview/dashboard">Dashboard</a> <span>›</span>
    <a href="/preview/grants">Expected Grants</a> <span>›</span>
    <span>Report Expected Grant</span>
  </nav>

  <div class="layout">
    <!-- Step sidebar -->
    <aside class="steps">
      <ol>
        <li class="step current">
          <span class="step-num">1</span>
          <div>
            <span class="step-title">Grant Details</span>
            <span class="step-sub">Enter information for this grant.</span>
          </div>
        </li>
        <li class="step">
          <span class="step-num">2</span>
          <div>
            <span class="step-title">Confirmations</span>
            <span class="step-sub">Review and confirm details.</span>
          </div>
        </li>
        <li class="step">
          <span class="step-num">3</span>
          <div>
            <span class="step-title">Review &amp; Submit</span>
            <span class="step-sub">Submit the grant.</span>
          </div>
        </li>
      </ol>

      <div class="help card">
        <Icon name="help" size={18} class="help-icon" />
        <div>
          <strong>Need help?</strong>
          <p>Our team is here to help you report expected grants.</p>
          <a href="/preview">Contact Support →</a>
        </div>
      </div>
    </aside>

    <!-- Form -->
    <section class="form-area">
      <div class="header-row">
        <div>
          <h1>Report Expected Grant</h1>
          <p>Let us know about an incoming grant so we can match and process it quickly.</p>
        </div>
        <div class="actions">
          <button class="ghost">Save Draft</button>
        </div>
      </div>

      <div class="form-card">
        <fieldset>
          <legend>Grant details</legend>

          <div class="grid-2">
            <div class="field donor-field">
              <label for="donor">Donor / Funder <span class="req">*</span></label>
              <div class="input-wrap">
                <Icon name="search" size={16} />
                <input
                  id="donor"
                  type="text"
                  bind:value={donorInput}
                  oninput={() => (donorRecognized = knownDonors.includes(donorInput))}
                  placeholder="Start typing to search known donors…"
                  autocomplete="off"
                />
                {#if donorInput}
                  <button class="clear" aria-label="Clear" onclick={() => { donorInput = ''; donorRecognized = false }}>
                    <Icon name="x" size={14} />
                  </button>
                {/if}
              </div>
              {#if filteredDonors.length}
                <ul class="suggest">
                  {#each filteredDonors as d}
                    <li><button onclick={() => pickDonor(d)}>{d}</button></li>
                  {/each}
                </ul>
              {/if}
              {#if donorRecognized}
                <p class="recognized"><Icon name="check" size={14} /> Donor recognized</p>
              {:else if donorInput}
                <p class="pending"><Icon name="clock" size={14} /> New donor — we'll add to the database</p>
              {/if}
            </div>

            <div class="field">
              <label for="amount">Expected Amount <span class="req">*</span></label>
              <div class="input-wrap"><span class="prefix">$</span><input id="amount" type="text" bind:value={amount} placeholder="25,000.00" /></div>
            </div>

            <div class="field">
              <label for="date">Expected Date <span class="req">*</span></label>
              <div class="input-wrap"><Icon name="calendar" size={16} /><input id="date" type="date" bind:value={expectedDate} /></div>
            </div>

            <div class="field">
              <label for="payment">Payment Type <span class="req">*</span></label>
              <select id="payment" bind:value={paymentType}>
                <option>ACH</option>
                <option>Check</option>
                <option>Wire</option>
                <option>Other</option>
              </select>
            </div>

            <div class="field span-2">
              <label for="program">Grant / Program Name <span class="opt">(Optional)</span></label>
              <input id="program" type="text" bind:value={programName} placeholder="e.g., Community Food Initiative" />
            </div>

            <div class="field span-2">
              <span class="field-label">Attach Document <span class="opt">(Optional)</span></span>
              <div class="upload" role="button" tabindex="0">
                <Icon name="upload" size={18} />
                <span>Upload File</span>
                <small>PDF, DOC, JPG up to 10 MB</small>
              </div>
            </div>
          </div>
        </fieldset>
      </div>

      <div class="confirm-card form-card">
        <fieldset>
          <legend>Confirmations</legend>
          <p class="confirm-sub">Please confirm the following before continuing:</p>
          <ul class="confirms">
            {#each confirmations as c}
              <li>
                <label>
                  <input type="checkbox" bind:checked={checked[c.id]} />
                  <span>{c.label}</span>
                </label>
              </li>
            {/each}
          </ul>
        </fieldset>
      </div>

      <div class="form-footer">
        <button class="ghost">Cancel</button>
        <button class="primary" disabled={!allRequired}>Save &amp; Continue</button>
      </div>
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

  .steps ol { list-style: none; padding: 0; margin: 0; display: grid; gap: 1rem; }
  .step { display: flex; gap: 0.85rem; align-items: flex-start; }
  .step-num {
    width: 1.85rem; height: 1.85rem; border-radius: 50%;
    background: var(--cg-bg); border: 1px solid var(--cg-border);
    display: grid; place-items: center; font-weight: 600; color: var(--cg-text-muted);
    flex-shrink: 0;
  }
  .step.current .step-num { background: var(--cg-green); color: white; border-color: var(--cg-green); }
  .step-title { display: block; font-weight: 600; font-size: 0.92rem; color: var(--cg-text); }
  .step-sub { display: block; font-size: 0.8rem; color: var(--cg-text-muted); margin-top: 0.1rem; }

  .help {
    margin-top: 2rem; padding: 1.1rem;
    background: var(--cg-surface); border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius); display: flex; gap: 0.75rem;
  }
  :global(.help-icon) { color: var(--cg-green); flex-shrink: 0; margin-top: 0.15rem; }
  .help strong { font-weight: 600; font-size: 0.9rem; }
  .help p { margin: 0.25rem 0 0.5rem; font-size: 0.82rem; color: var(--cg-text-muted); }
  .help a { font-size: 0.85rem; color: var(--cg-green); }

  .form-area { display: grid; gap: 1.25rem; }

  .header-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; }
  .header-row h1 { margin: 0 0 0.2rem; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.01em; }
  .header-row p { margin: 0; color: var(--cg-text-muted); font-size: 0.9rem; }

  .actions { display: flex; gap: 0.5rem; }
  .ghost {
    padding: 0.55rem 0.95rem; background: var(--cg-surface);
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    font-size: 0.88rem; cursor: pointer; color: var(--cg-text);
  }
  .ghost:hover { border-color: var(--cg-green); }
  .primary {
    padding: 0.55rem 1.25rem;
    background: var(--cg-green); color: white; border: none;
    border-radius: var(--cg-radius-sm); font-size: 0.92rem; font-weight: 500; cursor: pointer;
  }
  .primary:hover:not(:disabled) { background: var(--cg-green-hover); }
  .primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .form-card {
    background: var(--cg-surface); border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius); padding: 1.5rem;
  }
  fieldset { border: none; padding: 0; margin: 0; }
  legend { font-weight: 600; font-size: 1rem; margin-bottom: 1rem; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.25rem; }
  @media (max-width: 700px) { .grid-2 { grid-template-columns: 1fr; } }
  .span-2 { grid-column: 1 / -1; }

  .field { display: grid; gap: 0.4rem; position: relative; }
  .donor-field { grid-column: 1 / -1; }
  label, .field-label { font-size: 0.85rem; font-weight: 500; color: var(--cg-text); }
  .req { color: var(--cg-error); }
  .opt { color: var(--cg-text-muted); font-weight: 400; font-size: 0.8rem; }

  .input-wrap {
    display: flex; align-items: center; gap: 0.5rem;
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    padding: 0 0.85rem; background: var(--cg-surface);
    color: var(--cg-text-muted);
  }
  .input-wrap:focus-within { border-color: var(--cg-green); box-shadow: 0 0 0 3px var(--cg-green-soft); }
  .input-wrap input { flex: 1; border: none; outline: none; padding: 0.7rem 0; font-size: 0.92rem; background: transparent; color: var(--cg-text); }
  .prefix { color: var(--cg-text-muted); font-weight: 500; }
  .clear { background: transparent; border: none; color: var(--cg-text-muted); cursor: pointer; padding: 0.25rem; }

  select {
    padding: 0.7rem 0.85rem; font-size: 0.92rem;
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    background: var(--cg-surface); color: var(--cg-text); cursor: pointer;
  }
  select:focus { outline: none; border-color: var(--cg-green); box-shadow: 0 0 0 3px var(--cg-green-soft); }

  .field > input[type='text'] {
    padding: 0.7rem 0.85rem; font-size: 0.92rem;
    border: 1px solid var(--cg-border); border-radius: var(--cg-radius-sm);
    background: var(--cg-surface); color: var(--cg-text);
  }
  .field > input[type='text']:focus { outline: none; border-color: var(--cg-green); box-shadow: 0 0 0 3px var(--cg-green-soft); }

  .suggest {
    list-style: none; padding: 0; margin: 0.3rem 0 0;
    background: var(--cg-surface); border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm); box-shadow: var(--cg-shadow);
    max-height: 200px; overflow-y: auto;
    position: absolute; top: 100%; left: 0; right: 0; z-index: 10;
  }
  .suggest button {
    width: 100%; text-align: left; padding: 0.6rem 0.85rem;
    background: transparent; border: none; cursor: pointer;
    font-size: 0.9rem; color: var(--cg-text);
  }
  .suggest button:hover { background: var(--cg-bg); }

  .recognized, .pending {
    display: inline-flex; align-items: center; gap: 0.35rem;
    margin: 0.4rem 0 0; font-size: 0.82rem; font-weight: 500;
  }
  .recognized { color: var(--cg-green); }
  .pending { color: #b96e0c; }

  .upload {
    display: flex; align-items: center; gap: 0.7rem;
    padding: 1rem 1.25rem; border: 1px dashed var(--cg-border);
    border-radius: var(--cg-radius-sm); background: var(--cg-bg);
    color: var(--cg-text-muted); cursor: pointer;
  }
  .upload:hover { border-color: var(--cg-green); color: var(--cg-green); }
  .upload small { margin-left: auto; font-size: 0.78rem; }

  .confirm-sub { margin: -0.5rem 0 0.85rem; color: var(--cg-text-muted); font-size: 0.88rem; }
  .confirms { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.7rem; }
  .confirms label {
    display: grid; grid-template-columns: auto 1fr; gap: 0.6rem;
    padding: 0.7rem 0.85rem; border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm); cursor: pointer;
    font-size: 0.9rem; font-weight: 400; align-items: flex-start;
  }
  .confirms label:hover { border-color: var(--cg-green); background: var(--cg-bg); }
  .confirms input[type='checkbox'] {
    width: 1.1rem; height: 1.1rem; accent-color: var(--cg-green); margin-top: 0.15rem;
  }

  .form-footer { display: flex; justify-content: space-between; }
</style>
