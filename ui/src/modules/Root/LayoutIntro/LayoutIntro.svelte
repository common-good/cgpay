<script>
  import { Route } from 'svelte-router-spa'

  // --------------------------------------------

  export let currentRoute
</script>

<div class='layout-intro'>
  <div class='content'>
    <Route { currentRoute } />
  </div>
</div>

<style lang='stylus'>
  .layout-intro
    background $c-green
    min-height 100vh

    .content
      contentNarrow()
      padding $s2
</style>
