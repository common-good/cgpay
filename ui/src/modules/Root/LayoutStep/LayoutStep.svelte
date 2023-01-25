<script>
  import { Route } from 'svelte-router-spa'
  import cgLogo from '#modules/Root/assets/cg-logo-300.png?webp'
  import { navigateTo } from 'svelte-router-spa'
  import store from '#store.js'

  export let params // else Svelte complains (I don't know why yet)
  export let currentRoute

  // --------------------------------------------
</script>

<div class='layout-step'>
  <header>
      <img class="img" src={ cgLogo } alt='Common Good Logo' on:click={ () => navigateTo('/home') } />
      {#if $store.myAccount.name}
      <h2>{ $store.myAccount.name }</h2>
      {/if}
      <div class="img"></div>
  </header>

  <div class='content'>
    <Route { currentRoute } />
  </div>
</div>

<style lang='stylus'>
  .layout-step
    contentNarrow()
    height 100vh
    padding $s2

  header
    display flex
    align-items center
    margin-bottom: $s2

  h2
    width 100%
    text-align center
    text md
    padding 0 $s1

  .img
    clampSize(20vw, 50px)

  .content
    height calc(100% - 50px)
</style>
