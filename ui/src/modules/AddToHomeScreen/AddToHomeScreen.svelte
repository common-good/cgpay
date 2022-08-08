<script>
  import { navigateTo } from 'svelte-router-spa'

  import store from '#app.store.js'

  import AndroidInstructions from './AndroidInstructions/AndroidInstructions.svelte'
  import AppleInstructions from './AppleInstructions/AppleInstructions.svelte'

  import cgLogo from './assets/cg-logo-300.png'

  // --------------------------------------------

  function skip() {
    store.homeScreen.skip()
    navigateTo('/pay')
  }
</script>

<svelte:head>
  <title>CG Pay - Add to Home Screen</title>
</svelte:head>

<section id='add-to-home-screen'>
  <div class='wrapper'>
    <img src= { cgLogo } alt="Common Good logo" />
    <h1>Add to Home Screen</h1>

    { #if $store.deviceType === 'Apple' }
      <AppleInstructions { skip } />
    { /if }

    { #if $store.deviceType === 'Android' }
      <AndroidInstructions { skip } />
    { /if }
  </div>
</section>

<style lang='stylus'>
  h1
    text lg
    font-weight 600
    margin 0 0 $s2

  img
    margin 0 0 $s2
    width 6rem

  .wrapper
    flexCenter column
    background $white
    border solid 1px $black
    margin $s2
    padding $s2 $s2 $s3
</style>
