<script lang="ts">
  // Accessible tooltip wrapper. Wrap any element; shows on hover AND keyboard focus
  // (so it's usable without a mouse), hides on Escape, and uses aria-describedby so
  // screen readers announce the description.

  import type { Snippet } from 'svelte'

  type Position = 'top' | 'bottom' | 'left' | 'right'
  type Props = { text: string; position?: Position; children: Snippet }

  let { text, position = 'top', children }: Props = $props()

  let open = $state(false)
  let id = $state(`tt-${Math.random().toString(36).slice(2, 9)}`)

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false
  }
</script>

<!-- Tooltip wrapper listens for events bubbling from its child trigger. The wrapper itself
     isn't a control, so the standard a11y rules don't apply; the trigger gets the focus/hover
     and the wrapper just toggles the tip's visibility. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<span
  class="wrap"
  role="group"
  onmouseenter={() => (open = true)}
  onmouseleave={() => (open = false)}
  onfocusin={() => (open = true)}
  onfocusout={() => (open = false)}
  onkeydown={onKey}
  aria-describedby={id}
>
  {@render children()}
  <span
    role="tooltip"
    {id}
    class="tip tip-{position}"
    class:open
  >
    {text}
  </span>
</span>

<style>
  .wrap {
    position: relative;
    display: inline-block;
  }
  .tip {
    position: absolute;
    z-index: 50;
    padding: 0.45rem 0.7rem;
    background: #1a1f1c;
    color: #f5f7f4;
    font-size: 0.78rem;
    font-weight: 500;
    border-radius: 6px;
    white-space: normal;
    max-width: 240px;
    line-height: 1.35;
    pointer-events: none;
    opacity: 0;
    transform: translateY(2px);
    transition: opacity 0.12s, transform 0.12s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  .tip.open { opacity: 1; transform: translateY(0); }

  .tip-top {
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translate(-50%, 2px);
  }
  .tip-top.open { transform: translate(-50%, 0); }

  .tip-bottom {
    top: calc(100% + 8px);
    left: 50%;
    transform: translate(-50%, -2px);
  }
  .tip-bottom.open { transform: translate(-50%, 0); }

  .tip-left {
    right: calc(100% + 8px);
    top: 50%;
    transform: translate(2px, -50%);
  }
  .tip-left.open { transform: translate(0, -50%); }

  .tip-right {
    left: calc(100% + 8px);
    top: 50%;
    transform: translate(-2px, -50%);
  }
  .tip-right.open { transform: translate(0, -50%); }

  /* Small arrow */
  .tip::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background: #1a1f1c;
    transform: rotate(45deg);
  }
  .tip-top::after    { bottom: -3px;  left: 50%; margin-left: -4px; }
  .tip-bottom::after { top: -3px;     left: 50%; margin-left: -4px; }
  .tip-left::after   { right: -3px;   top: 50%;  margin-top: -4px; }
  .tip-right::after  { left: -3px;    top: 50%;  margin-top: -4px; }
</style>
