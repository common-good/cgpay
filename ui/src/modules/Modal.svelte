<script>
  import { createEventDispatcher, onDestroy } from 'svelte'

  export let show
  export let title
  export let text
  export let labels
//  export let lab2
  let modal
  let lab1, lab2

  $: ([lab1, lab2] = labels.split(', '))

  const dispatch = createEventDispatcher()

  const previously_focused = typeof document !== 'undefined' && document.activeElement
  if (previously_focused) {
    onDestroy(() => {previously_focused.focus()})
  }
</script>

{ #if show }
  <div class="modal-background"></div>

  <div class="modal" role="dialog" aria-modal="true" bind:this={modal}>
    <h2>{ title }</h2>
    <p>{ text }</p>
    <button on:click={ () => dispatch('fn1') }>{ lab1 }</button>
    <button on:click={ () => dispatch('fn2') }>{ lab2 }</button>
  </div>
{ /if }

<style lang='stylus'>
  .modal-background
    position fixed
    top 0
    left 0
    width 100%
    height 100%
    background rgba(0,0,0,0.3)

  .modal
    position absolute
    left 50%
    top 50%
    width calc(100vw - 4em)
    max-width 32em
    max-height calc(100vh - 4em)
    overflow auto
    transform translate(-50%,-50%)
    padding 1em
    border-radius 1em
    background white

  button
    cgButton()
      width 40%

</style>
