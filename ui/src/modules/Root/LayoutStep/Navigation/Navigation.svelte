<script>
  import CloseIcon from "svelte-material-icons/Close.svelte"
  import { createEventDispatcher } from "svelte"
  import { navigateTo } from 'svelte-router-spa'
  import { focusTrap } from 'svelte-focus-trap'
  import store from '#store.js'
  import { pageUri } from '#utils.js'

  let nav

  const dispatch = createEventDispatcher();
  function closeNav() { dispatch('toggleNav', {}) }
  function signOut() { store.signOut(); store.setAcctChoices(null); navigateTo('/sign-in') }
  function switchAccount() { store.signOut(); navigateTo('/link-account') }
  function rearCamera() { store.setFrontCamera(false) }
  function frontCamera() { store.setFrontCamera(true) }
  function comment() { navigateTo('/comment')}
  function wifiOn() { store.setWifi(true) }
  function wifiOff() { store.setWifi(false) }
  function selfServeOn() { store.setSelfServe(true) }
  function selfServeOff() { store.setSelfServe(false) }
  async function clearData() { store.clearData(); navigateTo('/'); navigateTo('/') }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class='background' on:click={closeNav}>
  <nav bind:this={nav} use:focusTrap>
    <header>
      <button class='close' on:click={closeNav}><CloseIcon width={'48px'} height={'48px'} ariaLabel={'close'}/></button>
    </header>
    <menu>
      { #if $store.choices?.length > 1 && pageUri() != 'link-account' && !$store.selfServe }
        <li><button on:click={switchAccount}>Switch Account</button></li>
      { /if }

      { #if $store.cameraCount > 1 }
        { #if $store.frontCamera }
          <li><button on:click={rearCamera}>Use Rear Camera</button></li>
        { :else }
          <li><button on:click={frontCamera}>Use Front Camera</button></li>
        { /if }
      { /if }

      { #if pageUri() == 'home' }
        { #if $store.selfServe }
          <li><button on:click={selfServeOff}>Self Serve Off</button></li>
        { :else }
            <li><button on:click={selfServeOn}>Self Serve On</button></li>
        { /if }
      { /if }

      { #if store.isSignedIn() && !$store.selfServe }
        <li><button on:click={comment}>Comments & Suggestions</button></li>
      { /if }

      { #if store.isSignedIn() && !$store.selfServe }
        <li><button on:click={signOut}>Sign Out</button></li>
      { /if }

      { #if $store.testing }

        { #if $store.useWifi }
          <li><button on:click={wifiOff}>Turn Wifi Off</button></li>
        { :else }
          <li><button on:click={wifiOn}>Turn Wifi On</button></li>
        { /if }

        <li><button on:click={clearData}>START OVER</button></li>

      { /if }
    </menu> 
  </nav>
</div>

<style lang='stylus'>
  header
    display flex
    justify-content flex-end
    background $c-green-light

  menu
    padding $s-2 0

  nav
    position absolute
    right 0
    width 220px
    background $c-white
    text-align right
    box-shadow 2px 2px 4px $c-gray-dark
    border-radius 0 1em
    z-index 2

  li
    height 48px
    display flex
    justify-content flex-end
    align-items center
    
    button
      width 100%
      height 100%
      text-align right
      padding-right $s0

  .background
    position absolute
    height 100%
    width 100%
    background rgba(0,0,0,0.3)

  .close
    height 60px
    padding-right 6px

</style>