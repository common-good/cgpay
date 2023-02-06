<script>
  import { Route, navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte';
  import cgLogo from '#modules/Root/assets/cg-logo-300.png?webp'
  import cgLogoDemo from '#modules/Root/assets/cg-logo-300-demo.png?webp'
  import { navigateTo } from 'svelte-router-spa'
  import store from '#store.js'

  // --------------------------------------------

  export let currentRoute
</script>

<div class='layout-step' style="height: {viewHeight}px">
  <header>
    <img class="corner" src={ $store.testing ? cgLogoDemo : cgLogo } alt='Common Good Logo' on:click={ () => navigateTo('/home') } />
    {#if $store.myAccount.name}
      <h2>{ $store.myAccount.name }</h2>
    {/if}
    <div class="corner"><!--menu--></div>
  </header>

  <div class='content'>
    <Route { currentRoute } />
  </div>
</div>

<style lang='stylus'>
  .layout-step
    contentNarrow()
    height 100%
    display: flex
    flex-direction column
    padding $ss

  header
    display flex
    align-items center
    margin-bottom: $ss

  h2
    width 100%
    text-align center
    text md
    padding 0 $s1

  .corner
    height 48px
    width 48px

  .content
    height 100%
</style>
