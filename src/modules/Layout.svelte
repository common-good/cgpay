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

  function socket() {
    if ($st.me.isCo) return // only for individual accounts for now
    if ($st.socket) try {
      $st.socket.close() // for now, reopen every time
    } catch (er) {}

    if (!('WebSocket' in window)) return null
    let socket
    try {
      socket = new WebSocket(u.socket()) // socket.readyState has status
      socket.onopen = () => {
        const msg = JSON.stringify({ op:'connect', actorId:$st.me.accountId, deviceId:$st.me.deviceId })
        try {
          socket.send(msg)
        } catch (er) { console.log('socket error', er) }
      }
      socket.onclose = () => {}			
      socket.onmessage = (msg) => {
        const m = JSON.parse(msg.data) // get message, action, and note

        if (m.action == 'request') {
          u.yesno(m.message, () => st.txConfirm(true, m), () => st.txConfirm(false, m))
        } else {
          u.alert(m.message)
          u.getInfo() // if we're being told about a charge or payment, refresh the list of recent txs
        }
      }
    } catch(er) { console.log('socket error', er); return null }

    return socket
  }

  u.undo = writable(0)
  if (!$st.socket || true) st.setSocket(socket())
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
