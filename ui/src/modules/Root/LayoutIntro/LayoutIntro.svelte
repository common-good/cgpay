<script>
  import { Route } from 'svelte-router-spa'

  // --------------------------------------------

  export let currentRoute
</script>

<div id='layout-intro'>
  <div id='layout-intro-content'>
    <Route { currentRoute } />
  </div>
</div>

<style lang='stylus'>
  #layout-intro
    background $c-green
    fullHeight()

    #layout-intro-content
      contentNarrow()
      padding $s3
</style>
