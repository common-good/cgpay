<script lang="ts">
  let { data, form } = $props()

  // On error, Svelte provides form.values with what the user typed. On first
  // paint, pre-populate from the current user record.
  const initial = $derived({
    fullName: form?.values?.fullName ?? data.user.fullName ?? '',
    email:    form?.values?.email    ?? data.user.email    ?? '',
    phone:    form?.values?.phone    ?? data.user.phone    ?? '',
    address:  form?.values?.address  ?? '',
    city:     form?.values?.city     ?? '',
    state:    form?.values?.state    ?? '',
    zip:      form?.values?.zip      ?? ''
  })

  const errors = $derived(form?.errors ?? {})
</script>

<nav class="crumbs" aria-label="Breadcrumb">
  <a href="/admin/members">Members</a>
  <span class="sep">/</span>
  <a href={`/admin/users/${data.user.uid}`}>{data.user.name}</a>
  <span class="sep">/</span>
  <span>Edit</span>
</nav>

<h1>Edit contact info</h1>
<p class="subtitle">Changes are logged to the audit trail. Flag changes, password resets, and account suspensions live in a separate screen.</p>

{#if form?.message && !form?.errors}
  <div class="banner-error" role="alert">{form.message}</div>
{/if}

<form method="POST" class="edit-form" novalidate>
  <div class="field">
    <label for="fullName">Full name</label>
    <input id="fullName" name="fullName" type="text" value={initial.fullName} autocomplete="name" />
    {#if errors.fullName}<p class="err">{errors.fullName}</p>{/if}
  </div>

  <div class="field">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" value={initial.email} autocomplete="email" />
    {#if errors.email}<p class="err">{errors.email}</p>{/if}
  </div>

  <div class="field">
    <label for="phone">Phone</label>
    <input id="phone" name="phone" type="tel" value={initial.phone} autocomplete="tel" />
    {#if errors.phone}<p class="err">{errors.phone}</p>{/if}
  </div>

  <fieldset class="address">
    <legend>Address</legend>
    <div class="field">
      <label for="address">Street</label>
      <input id="address" name="address" type="text" value={initial.address} autocomplete="street-address" />
    </div>
    <div class="field-row">
      <div class="field grow"><label for="city">City</label><input id="city" name="city" type="text" value={initial.city} /></div>
      <div class="field short"><label for="state">State</label><input id="state" name="state" type="text" value={initial.state} /></div>
      <div class="field short"><label for="zip">Zip</label><input id="zip" name="zip" type="text" value={initial.zip} /></div>
    </div>
  </fieldset>

  <div class="actions">
    <a class="btn btn-ghost" href={`/admin/users/${data.user.uid}`}>Cancel</a>
    <button class="btn btn-primary" type="submit">Save changes</button>
  </div>
</form>

<style>
  .crumbs {
    font-size: 0.85rem;
    color: var(--cg-text-muted);
    margin-bottom: 0.75rem;
  }
  .crumbs a { color: var(--cg-navy); text-decoration: none; }
  .crumbs a:hover { text-decoration: underline; }
  .crumbs .sep { margin: 0 0.4rem; opacity: 0.5; }

  h1 {
    margin: 0 0 0.4rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--cg-text);
    letter-spacing: -0.01em;
  }
  .subtitle {
    margin: 0 0 1.5rem;
    color: var(--cg-text-muted);
    font-size: 0.9rem;
    line-height: 1.4;
    max-width: 60ch;
  }

  .banner-error {
    padding: 0.75rem 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    border-radius: var(--cg-radius-sm);
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 560px;
  }

  .field { display: flex; flex-direction: column; gap: 0.3rem; }
  .field label {
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--cg-text-muted);
  }
  .field input {
    padding: 0.55rem 0.75rem;
    font-size: 0.95rem;
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius-sm);
    background: var(--cg-surface);
    color: var(--cg-text);
  }
  .field input:focus {
    outline: none;
    border-color: var(--cg-navy);
    box-shadow: 0 0 0 3px rgba(9, 70, 166, 0.12);
  }
  .err {
    margin: 0;
    font-size: 0.82rem;
    color: var(--cg-error);
  }

  .address {
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    padding: 1rem;
    background: var(--cg-surface);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 0;
  }
  .address legend {
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--cg-text-muted);
    padding: 0 0.4rem;
  }
  .field-row { display: flex; gap: 0.75rem; }
  .field-row .grow { flex: 1; }
  .field-row .short { flex: 0 0 110px; }

  .actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }
  .btn {
    padding: 0.6rem 1.1rem;
    border-radius: var(--cg-radius-sm);
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    text-decoration: none;
    text-align: center;
  }
  .btn-primary { background: var(--cg-navy); color: #fff; }
  .btn-primary:hover { opacity: 0.92; }
  .btn-ghost {
    background: transparent;
    color: var(--cg-text);
    border-color: var(--cg-border);
  }
  .btn-ghost:hover { background: rgba(0, 0, 0, 0.03); text-decoration: none; }

  @media (max-width: 480px) {
    .field-row { flex-direction: column; }
    .field-row .short { flex: 1; }
    .actions { flex-direction: column-reverse; }
    .actions .btn { width: 100%; }
  }
</style>
