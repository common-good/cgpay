<script>
  import { Route } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import AlertCircle from "svelte-material-icons/AlertCircle.svelte"

  import store from '#store.js'

  // --------------------------------------------

  export let currentRoute
  let viewHeight
  onMount(() => viewHeight = window?.visualViewport?.height)
</script>

<div class='layout-intro' style="height: {viewHeight}px">
  { #if $store.network.offline }
    <div class='warning'>
      <AlertCircle size={"1.25rem"} /><p>You are offline.</p>
    </div>
 { /if }
  <div class='container'>
    <Route { currentRoute } />
  </div>
</div>

<style lang='stylus'>
  .layout-intro
    height 100%
    background $c-green
    
  .container
    constrainWidth($tablet)
    height 100%
    padding $s-1
    margin 0 auto  

  .warning
    position absolute
    width 100%
    display flex
    align-items center
    height 48px
    background $c-warning
    border-bottom solid 2px $c-warning-dark
    box-shadow 0 1px 2px $c-gray
    padding 0 $s0

    p
      margin-left $s-1
</style>
