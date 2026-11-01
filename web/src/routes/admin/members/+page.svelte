<h1>Members</h1>
<p class="subtitle">Scaffold - filtering, sorting, and pagination land in the follow-up PR.</p>

<div class="stub">
  <p>
    This is a placeholder screen. The full members list will render here once we
    have a paginated data endpoint on the PHP side (or a read plan that works
    within the current DB-user permissions).
  </p>
  <p>Planned columns: name, account code, join date, balance, status, actions.</p>
</div>

<style>
  h1 {
    margin: 0 0 0.35rem;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--cg-text);
    letter-spacing: -0.01em;
  }
  .subtitle {
    margin: 0 0 1.5rem;
    color: var(--cg-text-muted);
    font-size: 0.95rem;
  }
  .stub {
    background: var(--cg-surface);
    border: 1px dashed var(--cg-border);
    border-radius: var(--cg-radius);
    padding: 1.5rem;
    color: var(--cg-text-muted);
    max-width: 65ch;
  }
  .stub p { margin: 0 0 1rem; line-height: 1.55; }
  .stub p:last-child { margin-bottom: 0; }
</style>
