<script>
  import { Route, navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import NavIcon from "svelte-material-icons/Menu.svelte"
  import BackIcon from "svelte-material-icons/ChevronLeft.svelte"
  import Navigation from '#modules/Navigation.svelte'
  import NetworkStatus from '#modules/NetworkStatus.svelte'
  import cgLogo from '#modules/assets/cg-logo-300.png?webp'
  import st from'#store.js'
  import u from '#utils.js'

  /**
   * Layout the standard page.
   * In self-serve mode, the menu is available only on the home page.
   */

  export let currentRoute

  let viewHeight
  let isNavOpen

  function toggleNav() { isNavOpen = !isNavOpen }
  function goHome() { u.go('home') }

  const setViewportHeight = () => {
    viewHeight = window.visualViewport.height
  }
</script>

<svelte:window on:load={setViewportHeight}/>

<div class="layout-step" style="height: {viewHeight}px">
  { #if isNavOpen }
    <Navigation on:toggleNav={toggleNav}/>
  { /if }
  <header>
    {#if $st.hdrLeft == 'back'}
      <button on:click={u.goBack} class="btn" data-testid="btn-back" aria-label="Back"><BackIcon width={'100%'} height={'100%'} /></button>
    {:else if $st.hdrLeft == 'logo'}
      <img src={ cgLogo } alt='Common Good Logo' />
    {/if}
    <button on:click={goHome} data-testid="account-name">{ ($st.myAccount ? $st.myAccount.name : '') + (u.realData() ? '' : ' (DEMO)')}</button>
    { #if $st.hdrRight == 'nav' }
      <button data-testid="btn-nav" class="btn" aria-label="Menu" on:click={toggleNav}><NavIcon width={'100%'} height={'100%'} /></button>
    { /if}
  </header>
  { #key currentRoute }<NetworkStatus/>{ /key }
  <div class="content">
    <Route { currentRoute }/>
  </div>
</div>

<style lang='stylus'>
  img, .btn
    height 48px
    width 48px

  header
    display flex
    align-items center
    justify-content space-between
    margin-bottom $s-2
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
