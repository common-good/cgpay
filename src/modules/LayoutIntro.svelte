<script>
  import { Route } from 'svelte-router-spa'
  import { onMount } from 'svelte'

  // --------------------------------------------

  export let currentRoute
  let viewHeight
  onMount(() => {
    viewHeight = window?.visualViewport?.height
    document.documentElement.classList.add('green')
  })
</script>

<div class='layout-intro' style="height: {viewHeight}px">
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
    padding $s-2
    margin 0 auto  
</style>
