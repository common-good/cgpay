<script>
  import CloseIcon from "svelte-material-icons/Close.svelte"
  import { createEventDispatcher } from "svelte"
  import { focusTrap } from 'svelte-focus-trap'
  import st from'#store.js'
  import u from '#utils.js'
  import c from '#constants.js'

  let nav

  const dispatch = createEventDispatcher()
  function closeNav() { dispatch('toggleNav', {}) }

  function scanIn() { st.setIntent('scanIn'); u.go('scan') }
  function rearCamera() { st.setFrontCamera(false) }
  function frontCamera() { st.setFrontCamera(true) }
  function switchAccount() { st.unlink(); u.go('link-account') }
  function comment() { u.go('comment')}
  function signOut() { st.signOut(); u.go('') }

  function wifiOn() { st.setWifi(true) }
  function wifiOff() { st.setWifi(false) }
  function clearData() { st.clearData(); u.go(''); u.go('') }

  let menuItems = []
  function item(text, callback, criteria, id) { menuItems.push({text, callback, criteria, id}) }

  item('Go Home', () => u.go('home'), () => !u.atHome(), 'home')
  item('Scan Yourself In to Pay', scanIn, () => u.atHome() && $st.payOk == 'scan' && !$st.coPaying && c.showScanToPayBiz, 'scanIn') // for managers
  item('Use Rear Camera', rearCamera, () => $st.cameraCount > 1 && $st.frontCamera && !st.selfServe(), 'rear')
  item('Use Front Camera', frontCamera, () => $st.cameraCount > 1 && !$st.frontCamera && !st.selfServe(), 'front')
  item('Exit Self Serve (signs out)', signOut, () => u.atHome() && st.selfServe(), 'selfOff')
  item('Switch Account', switchAccount, () => $st.choices?.length > 1 && u.pageUri() != 'link-account' && !st.selfServe(), 'switch')
  item('Give Feedback', comment, () => st.linked() && !st.selfServe(), 'comment')
  item('Sign Out', signOut, () => (st.linked() || u.pageUri() == 'link-account') && !st.selfServe(), 'signout')

  if (u.localMode()) {
    item('🌈 Turn Wifi Off', wifiOff, () => $st.useWifi)
    item('🌈 Turn Wifi On', wifiOn, () => !$st.useWifi)
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