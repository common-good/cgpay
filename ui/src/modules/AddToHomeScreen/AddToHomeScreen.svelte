<script>
  import { navigateTo } from 'svelte-router-spa'

  import cgLogo from '#modules/Root/assets/cg-logo-300.png?webp'
  import store from '#store.js'

  import AndroidInstructions from './AndroidInstructions/AndroidInstructions.svelte'
  import AppleInstructions from './AppleInstructions/AppleInstructions.svelte'

  // --------------------------------------------

  function skip() {
    store.homeScreen.skip()
    navigateTo('/charge')
  }
</script>

<svelte:head>
  <title>CGPay - Add to Home Screen</title>
</svelte:head>

<section id='add-to-home-screen'>
  <div id='add-to-home-screen-content'>
    <img src= { cgLogo } alt="Common Good logo" />
    <h1>Add to Home Screen</h1>

    { #if store.device.isApple() }
      <AppleInstructions { skip } />
    { /if }

    { #if store.device.isAndroid() }
      <AndroidInstructions { skip } />
    { /if }
  </div>
</section>

<style lang='stylus'>
  #add-to-home-screen-content
    background $c-white
    border solid 1px $c-black
    contentCentered(column)
    padding $s2 $s2 $s3

  img
    margin 0 0 $s2
    clampSize(20vw, 100px)

  h1
    font-weight 600
    margin 0 0 $s2
    text lg
    text-align center
</style>
