<script>
  import { Route } from 'svelte-router-spa'
  import { writable } from 'svelte/store'
  import NavIcon from "svelte-material-icons/Menu.svelte"
  import BackIcon from "svelte-material-icons/ChevronLeft.svelte"
  import Navigation from '#modules/Navigation.svelte'
  import NetworkStatus from '#modules/NetworkStatus.svelte'
  import Modal from '#modules/Modal.svelte'
  import cgLogo from '#modules/assets/cg-logo-300-noR.png?webp'
  import st from'#store.js'
  import u from '#utils.js'
  import c from '#constants.js'

  /**
   * Layout the standard page.
   */

  export let currentRoute

  let viewHeight
  let isNavOpen

  function toggleNav() { isNavOpen = !isNavOpen }
  function goHome() { u.go('home') }
  function setViewportHeight() { viewHeight = window.visualViewport.height }
  function goBack() { if (u.pageUri() == 'tx' && $st.pending) u.undo.update(n => n + 1); else u.goBack() }

  u.undo = writable(0)
  st.setSocket(u.socket())
</script>

<svelte:window on:load={setViewportHeight}/>

<div class="layout-step" style="height: {viewHeight}px">
  { #if isNavOpen }
    <Navigation on:toggleNav={toggleNav}/>
  { /if }
  <header>
    {#if $st.hdrLeft == 'back'}
      <button on:click={goBack} class="btn" data-testid="btn-back" aria-label="Back"><BackIcon width={'100%'} height={'100%'} /></button>
    {:else if $st.hdrLeft == 'logo'}
      <img src={ cgLogo } alt='Common Good Logo' />
    {/if}
    <button on:click={goHome} data-testid="account-name">{ ($st.me ? $st.me.name : '') + (u.realData() ? '' : ' (DEMO)')}</button>
    <button data-testid="btn-nav" class="btn" aria-label="Menu" on:click={toggleNav}><NavIcon width={'100%'} height={'100%'} /></button>
  </header>
  { #key currentRoute }<NetworkStatus/>{ /key }
  <div class="content">
    <Modal/>
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
    margin-bottom $s-4
    padding $s-2
    background $c-blue-light
    box-shadow 0 1px 4px $c-gray
    z-index 1
    position fixed
    width 100%
    max-width 820px

  .content
    height 100%
    padding $s-1
    margin-top 64px

  .layout-step
    height 100%
    position relative
    display flex
    flex-direction column
    background $c-white
    constrainWidth($tablet)

  @media screen and (max-width $xs-screen)
    .content
      padding $s-2
</style>
