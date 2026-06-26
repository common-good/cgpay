<script lang="ts">
  import favicon from '$lib/assets/favicon.svg'

  let { children } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
  :global(:root) {
    --cg-green: #1e7a3a;
    --cg-green-hover: #155a2b;
    --cg-green-soft: rgba(30, 122, 58, 0.08);
    --cg-navy: #0a2540;            /* matches the commongood.earth header */
    --cg-navy-soft: rgba(255, 255, 255, 0.1);
    --cg-bg: #f5f7f4;
    --cg-surface: #ffffff;
    --cg-border: #e4e8e4;
    --cg-text: #1a1f1c;
    --cg-text-muted: #5a615e;
    --cg-on-navy: #ffffff;
    --cg-on-navy-muted: rgba(255, 255, 255, 0.7);
    --cg-error: #b3261e;
    --cg-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06);
    --cg-radius: 12px;
    --cg-radius-sm: 8px;
  }

  :global(*) { box-sizing: border-box; }
  :global(html, body) {
    margin: 0;
    padding: 0;
    background: var(--cg-bg);
    color: var(--cg-text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  :global(button) { font-family: inherit; }
  :global(input) { font-family: inherit; }
  :global(a) { color: var(--cg-green); text-decoration: none; }
  :global(a:hover) { text-decoration: underline; }
</style>
