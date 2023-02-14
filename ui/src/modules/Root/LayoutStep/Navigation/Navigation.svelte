<script>
  import CloseIcon from "svelte-material-icons/Close.svelte"
  import { createEventDispatcher } from "svelte"
  import { navigateTo } from 'svelte-router-spa'
  import { focusTrap } from 'svelte-focus-trap'
  import store from '#store.js'

  let nav;

  const dispatch = createEventDispatcher();
  const closeNav = () => {
    dispatch('toggleNav', {})
  }

  const signOut = () => {
    store.signOut()
    navigateTo('/sign-in')
  }
</script>

<div class='background' on:click={closeNav}>
  <nav bind:this={nav} use:focusTrap>
    <header>
      <button class='close' on:click={closeNav}><CloseIcon width={'48px'} height={'48px'} ariaLabel={'close'}/></button>
    </header>
    <menu>
      { #if $store.myAccount && $store.myAccount.isCo }
        <!--li><a href='/link-account'>Link Account</a></li-->
      { /if }
      <li><button on:click={signOut}>Sign Out / Sign In</button></li>
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
    z-index 1

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