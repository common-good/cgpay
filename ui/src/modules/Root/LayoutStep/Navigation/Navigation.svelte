<script>
  import CloseIcon from "svelte-material-icons/Close.svelte"
  import { createEventDispatcher } from "svelte";
  import { navigateTo } from 'svelte-router-spa'
  import store from '#store.js'

  const dispatch = createEventDispatcher();
  const closeNav = () => {
    dispatch('toggleNav', {})
  }

  const signOut = () => {
    store.signOut()
    navigateTo('/sign-in')
  }
</script>

<nav>
  <header>
    <button class='close' on:click={closeNav}><CloseIcon width={'48px'} height={'48px'} ariaLabel={'close'}/></button>
  </header>
  <menu>
    {#if $store.isBusiness && store.myAccount.exists()}
      <li><a href='/link-account'>Link Account</a></li>
    {/if}
    <li><button on:click={signOut}>Sign Out</button></li>
  </menu> 
</nav>

<style lang='stylus'>
  header
    display flex
    justify-content flex-end

  menu
    padding-top $s-2

  nav
    position absolute
    right 0
    height 100%
    width 60%
    background $c-white
    text-align right
    box-shadow -1px 0 4px $c-gray
    border-radius 2px
    z-index 1

  li
    height 48px
    display flex
    justify-content flex-end
    align-items center
    padding-right $s0

  .close
    height 64px
    width 52px
    display flex
    align-items center
</style>