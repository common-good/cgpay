<script>
  import { Route, navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import NavIcon from "svelte-material-icons/Menu.svelte"
  import Navigation from '#modules/Navigation.svelte'
  import NetworkStatus from '#modules/NetworkStatus.svelte'
  import cgLogo from '#modules/assets/cg-logo-300.png?webp'
  import store from '#store.js'

  // --------------------------------------------

  export let currentRoute

  let viewHeight
  let isNavOpen

  const toggleNav = () => {isNavOpen = !isNavOpen}

  onMount(() => {
    viewHeight = window?.visualViewport?.height
  })
</script>

<div class='layout-step' style="height: {viewHeight}px">
  { #if isNavOpen }
    <Navigation on:toggleNav={toggleNav}/>
  { /if }
  <header>
    <button on:click={ () => navigateTo('/home') }><img src={ cgLogo } alt='Common Good Logo' /></button>
    <p data-testid="account-name">{ ($store.myAccount ? $store.myAccount.name : '') + ($store.testMode ? ' (DEMO)' : '')}</p>
    <button data-testid="nav-btn" on:click={toggleNav}> <NavIcon width={'100%'} height={'100%'} ariaLabel={'menu'} /></button>
  </header>
  { #key currentRoute }<NetworkStatus/>{ /key }
  <div class='content'>
    <Route { currentRoute }/>
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
    z-index 1

  .content
    height 100%
    padding $s-1 

  .layout-step
    height 100%
    position relative
    display flex
    flex-direction column
    background $c-white
    constrainWidth($tablet)
</style>
