<script>
  import { navigateTo } from 'svelte-router-spa'
  import cgLogo from '#modules/assets/cg-logo-300.png?webp'
  import store from '#store.js'
  import AndroidInstructions from '#modules/AndroidInstructions.svelte'
  import AppleInstructions from '#modules/AppleInstructions.svelte'
  import { onMount } from 'svelte'
  import { addableToHome, isApple, isAndroid } from '#utils.js'

  // --------------------------------------------

  function skip() {
    store.setSawAdd()
    navigateTo('/sign-in')
  }

  onMount(async () => {
    if (!addableToHome()) navigateTo('/sign-in')
  })
</script>

<svelte:head>
  <title data-testid="page-add-to-home-screen">CGPay - Add to Home Screen</title>
</svelte:head>

<section class="card" id='add-to-home-screen'>
  <header>
    <img src= { cgLogo } alt="Common Good logo" />
    <h1>Add to Home Screen</h1>
  </header>
    { #if isApple() }
      <AppleInstructions { skip } />
    { /if }

    { #if isAndroid() }
      <AndroidInstructions { skip } />
    { /if }
</section>

<style lang='stylus'>
  @import '../styles/AddToHomeScreen.styl'
</style>
