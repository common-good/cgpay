<script lang="ts">
  let { data } = $props()

  type Tile = {
    label: string
    value: number | null
    caption?: string
  }

  function fmt(n: number | null): string {
    if (n === null) return '-'
    return n.toLocaleString('en-US')
  }

  const tiles = $derived<Tile[]>([
    { label: 'Members', value: data.overview.members.total, caption: `${fmt(data.overview.members.active)} active` },
    { label: 'Sponsees', value: data.overview.sponsees.total, caption: 'fiscally sponsored partners' },
    { label: 'Transactions', value: data.overview.transactions.last30d, caption: 'in the last 30 days' },
    { label: 'Grants', value: data.overview.grants.pendingCount, caption: 'expected, not yet received' }
  ])
</script>

<h1>Overview</h1>
<p class="subtitle">Day-to-day snapshot of the member base and active flow.</p>

<div class="tile-grid">
  {#each tiles as tile}
    <div class="tile" class:unavailable={tile.value === null}>
      <div class="tile-label">{tile.label}</div>
      <div class="tile-value">{fmt(tile.value)}</div>
      {#if tile.caption}
        <div class="tile-caption">{tile.caption}</div>
      {/if}
    </div>
  {/each}
</div>

<p class="footnote">
  A dash (-) means the data source is currently unavailable to the dashboard user.
  This is expected during the transition from PHP admin tooling and will resolve
  once we add a dedicated PHP-side admin data endpoint.
</p>

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

  .tile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  .tile {
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    padding: 1.15rem 1.25rem;
    box-shadow: var(--cg-shadow);
  }
  .tile.unavailable { opacity: 0.55; }
  .tile-label {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--cg-text-muted);
    font-weight: 600;
  }
  .tile-value {
    margin-top: 0.4rem;
    font-size: 2rem;
    font-weight: 700;
    color: var(--cg-text);
    font-variant-numeric: tabular-nums;
  }
  .tile-caption {
    margin-top: 0.35rem;
    font-size: 0.82rem;
    color: var(--cg-text-muted);
  }

  .footnote {
    margin-top: 2rem;
    font-size: 0.8rem;
    color: var(--cg-text-muted);
    max-width: 65ch;
    line-height: 1.5;
  }
</style>
