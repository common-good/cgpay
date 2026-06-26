<script lang="ts">
  import logo from '$lib/assets/cg-logo.png'

  type Props = { size?: number }
  let { size = 32 }: Props = $props()
</script>

<div class="brand">
  <img src={logo} alt="" width={size} height={size} class="brand-mark" />
  <span class="brand-name">Common Good</span>
</div>

<style>
  .brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .brand-mark {
    display: block;
    object-fit: contain;
    flex-shrink: 0;
  }
  .brand-name {
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.85rem;
    color: var(--cg-text-muted);
  }
</style>
