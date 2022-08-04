<script>
  import { navigateTo } from 'svelte-router-spa'

  import store from '#app.store.js'

  import AndroidInstructions from './AndroidInstructions/AndroidInstructions.svelte'
  import AppleInstructions from './AppleInstructions/AppleInstructions.svelte'

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
  <h1>Add to Home Screen</h1>

  { #if $store.deviceType === 'Apple' }
    <AppleInstructions { skip } />
  { /if }

  { #if $store.deviceType === 'Android' }
    <AndroidInstructions { skip } />
  { /if }
</section>
