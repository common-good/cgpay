<script>
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import { focusTrap } from 'svelte-focus-trap'
  import { fade } from 'svelte/transition';

  export let m0
  let modal
  let show, title, text, labels, lab1, lab2, zot

$:  ([show, title, text, labels] = m0 ? m0 : [false, '', '', '']); // semi-colon here is required
$:  [lab1, lab2, zot] = (labels + ', ').split(', ')

  const dispatch = createEventDispatcher()

  const previously_focused = typeof document !== 'undefined' && document.activeElement
  if (previously_focused) {
    onDestroy(() => {previously_focused.focus()})
  }

</script>

{ #if show }
  <div class="modal-background" on:click={() => {show = false}}></div>

  <div class="modal" role="dialog" aria-modal="true" bind:this={modal} use:focusTrap in:fade out:fade>
    <h1 data-testid="messageTitle">{ title }</h1>
    <div class="content">
      <p data-testid="messageText">{ text }</p>
      <div class="buttons">
        <button class="primary" data-testid="btn1" on:click={ () => dispatch('m1') }>{ lab1 }</button>
        {#if lab2}
          <button class="secondary" data-testid="btn2" on:click={ () => dispatch('m2') }>{ lab2 }</button>
        {/if}
      </div>
    </div>
  </div>
{ /if }

<style lang='stylus'>
  h1
    color $c-white
    background $c-green-dark
    letter-spacing 0.025rem
    margin-bottom $s-2
    padding $s-1

  p
    margin-bottom: $s1

  .content
    padding: $s-1

  .modal-background
    position fixed
    top 0
    left 0
    width 100%
    height 100%
    background rgba(0,0,0,0.3)

  .modal
    position absolute
    left 0
    right 0
    top 144px
    margin 0 auto
    width calc(100vw - 3rem)
    max-width 512px
    max-height calc(100vh - 3rem)
    overflow auto
    border-radius $s0
    background white
    z-index: 1

  .buttons
    display flex
    justify-content space-between

  .primary
    cgButton()
    flex-grow 1
    order 2

  .secondary
    cgButtonSecondary()
    flex-grow 1
    margin-right $s-2

</style>
