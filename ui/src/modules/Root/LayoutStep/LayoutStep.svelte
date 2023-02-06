<script>
  import { Route, navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte';
  import Menu from "svelte-material-icons/Menu.svelte"
  import cgLogo from '#modules/Root/assets/cg-logo-300.png?webp'
  import cgLogoDemo from '#modules/Root/assets/cg-logo-300-demo.png?webp'
  import store from '#store.js'

  // --------------------------------------------

  export let currentRoute
  let viewHeight
  onMount(() => viewHeight = window?.visualViewport?.height)
</script>

<div class='layout-step' style="height: {viewHeight}px">
  <header>
    <button on:click={ () => navigateTo('/home') }><img src={ $store.testing ? cgLogoDemo : cgLogo } alt='Common Good Logo' /></button>
    {#if $store.myAccount.name}
      <p>{ $store.myAccount.name }</p>
    {/if}
    <button><Menu width={'100%'} height={'100%'} /></button>
  </header>

  <div class='content'>
    <Route { currentRoute } />
  </div>
</div>

<style lang='stylus'>
  button
    height 48px
    width 48px

  header
    display flex
    align-items center
    justify-content space-between
    margin-bottom $s0
    padding $s-2
    background $c-blue-light
    box-shadow 0 1px 4px $c-gray

  .content
    height 100%
    padding $s-1 

  .layout-step
    height 100%
    display: flex
    flex-direction column
    background $c-white
    constrainWidth($tablet)
</style>
