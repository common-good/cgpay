<script>
  import { navigateTo } from 'svelte-router-spa'

  import cgLogo from '#modules/Root/assets/cg-logo-300.png?webp'
  import store from '#store.js'

  import AndroidInstructions from './AndroidInstructions/AndroidInstructions.svelte'
  import AppleInstructions from './AppleInstructions/AppleInstructions.svelte'

  // --------------------------------------------

  function skip() {
    store.homeScreen.skip()
    navigateTo('/sign-in')
  }
</script>

<svelte:head>
  <title>CGPay - Add to Home Screen</title>
</svelte:head>

<section class="card" id='add-to-home-screen'>
  <header>
    <img src= { cgLogo } alt="Common Good logo" />
    <h1>Add to Home Screen</h1>
  </header>

    { #if store.device.isApple() }
      <AppleInstructions { skip } />
    { /if }

   { #if store.device.isAndroid() }
      <AndroidInstructions { skip } />
    { /if }
</section>

<style lang='stylus'>
  @import './AddToHomeScreen.styl'
</style>
