<script>
  import { Route } from 'svelte-router-spa'
  import cgLogo from '#modules/Root/assets/cg-logo-300.png?webp'
  import { navigateTo } from 'svelte-router-spa'

  export let params // else Svelte complains (I don't know why yet)
  export let currentRoute

  // --------------------------------------------
</script>

<div id='layout-step'>
  <header>
    <div id='layout-step-header-content'>
      <img src={ cgLogo } alt='Common Good Logo' on:click={ () => navigateTo('/home') } />
    </div>
  </header>

  <div id='layout-step-content'>
    <Route { currentRoute } />
  </div>
</div>

<style lang='stylus'>
  #layout-step
    fullHeight()
    padding $s2

    header
      #layout-step-header-content
        contentNarrow()

        img
          clampSize(20vw, 50px)

    #layout-step-content
      contentNarrow()
      margin $s2 auto
</style>
