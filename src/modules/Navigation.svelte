<script>
  import CloseIcon from "svelte-material-icons/Close.svelte"
  import { createEventDispatcher } from "svelte"
  import { navigateTo } from 'svelte-router-spa'
  import { focusTrap } from 'svelte-focus-trap'
  import store from '#store.js'
  import u from '#utils.js'
  import c from '#constants.js'

  let nav

  const dispatch = createEventDispatcher()
  function closeNav() { dispatch('toggleNav', {}) }

  function coReceive() { store.setCoPaying(false); navigateTo('/home') }
  function coPay() { store.setCoPaying(true); navigateTo('/home') }
  function scanIn() { store.setCoPaying(true); navigateTo('/scan?op=scanIn') }
  function rearCamera() { store.setFrontCamera(false) }
  function frontCamera() { store.setFrontCamera(true) }
  function selfServeOn() { store.setSelfServe(true) }
  function selfServeOff() { store.setSelfServe(false); signOut() } // sign out so naughty customers can't switch accounts or whatever
  function switchAccount() { store.unlink(); navigateTo('/link-account') }
  function comment() { navigateTo('/comment')}
  function signOut() { store.signOut(); navigateTo('/') }

  function wifiOn() { store.setWifi(true) }
  function wifiOff() { store.setWifi(false) }
  function clearData() { store.clearData(); navigateTo('/'); navigateTo('/') }

  let menuItems = []
  function item(text, callback, criteria, id) { menuItems.push({text, callback, criteria, id}) }

  item('Show Your QR to Receive', coReceive, () => $store.payOk == 'always' && $store.coPaying, 'showToReceive') // for companies
  item('Show Your QR to Pay', coPay, () => $store.payOk == 'always' && !$store.coPaying && !$store.selfServe, 'showToPay') // for companies
  item('Scan Yourself In to Pay', scanIn, () => $store.payOk == 'scan' && !$store.selfServe, 'scanIn') // for managers
  item('Use Rear Camera', rearCamera, () => $store.cameraCount > 1 && $store.frontCamera && $store.selfServe, 'rear')
  item('Use Front Camera', frontCamera, () => $store.cameraCount > 1 && !$store.frontCamera && $store.selfServe, 'front')
  item('Exit Self Serve (signs out)', selfServeOff, () => u.pageUri() == 'home' && $store.selfServe, 'selfOff')
  item('Enter Self Serve Mode', selfServeOn, () => u.pageUri() == 'home' && $store.myAccount.isCo && !$store.selfServe, 'selfOn')
  item('Switch Account', switchAccount, () => $store.choices?.length > 1 && u.pageUri() != 'link-account' && !$store.selfServe, 'switch')
  item('Comments & Suggestions', comment, () => store.linked() && !$store.selfServe, 'comment')
  item('Sign Out', signOut, () => (store.linked() || u.pageUri() == 'link-account') && !$store.selfServe, 'signout')

  if (u.localMode()) {
    item('🌈 Turn Wifi Off', wifiOff, () => $store.useWifi)
    item('🌈 Turn Wifi On', wifiOn, () => !$store.useWifi)
    item('🌈 START OVER', clearData, () => true)
  }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class='background' on:click={closeNav}>
  <nav bind:this={nav} use:focusTrap>
    <header>
      <button class='close' on:click={closeNav}><CloseIcon width={'48px'} height={'48px'} ariaLabel={'close'}/></button>
    </header>
    <menu>
      { #each menuItems as item } { #if item.criteria() }
        <li><button data-testid={'menu-' + item.id} on:click={item.callback}>{item.text}</button></li>
      { /if } { /each }
    </menu> 
  </nav>
</div>

<style lang='stylus'>
  header
    display flex
    justify-content flex-end
    background $c-green-light

  menu
    padding $s-2 $s-1

  nav
    position absolute
    right 0
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

  .background
    position absolute
    height 100%
    width 100%
    background rgba(0,0,0,0.3)

  .close
    height 60px
    padding-right 6px

</style>