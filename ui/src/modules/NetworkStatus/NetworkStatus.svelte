<script>
  import store from '#store.js'
  import { onMount } from 'svelte'

  import WifiOff from "svelte-material-icons/WifiOff.svelte"
  import CloseIcon from "svelte-material-icons/Close.svelte"

  let showNetworkStatus = true;
</script>

{ #if !$store.network.online && showNetworkStatus}
  <section id='network-status'>
    <div>
      <WifiOff size={"1.5rem"} />
      <p>Network is offline.</p>
    </div>
      <button on:click={() => showNetworkStatus = false}>
        <CloseIcon size={"1.5rem"} />
      </button>
  </section>
{ /if }

<style lang='stylus'>
  button
    height 48px
    width 48px
    position absolute
    right 0
    display flex
    align-items center
    justify-content center

  section
    width 100%
    display flex
    align-items center
    justify-content space-between
    background $c-warning
    border-bottom solid 2px $c-warning-dark
    box-shadow 0 1px 2px $c-gray
    padding $s-1
    position absolute
    z-index 1

  div
    display flex
    align-items center

  p
    margin-left $s-1
    text sm
</style>
