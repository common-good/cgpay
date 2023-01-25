<script>
  import { Route } from 'svelte-router-spa'

  // --------------------------------------------

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

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
