<script>
  import { navigateTo } from 'svelte-router-spa'

  import AndroidInstructions from './AndroidInstructions/AndroidInstructions.svelte'
  import AppleInstructions from './AppleInstructions/AppleInstructions.svelte'
  import preferencesStore from '../Preferences/preferences.store.js'

  import cgLogo from './assets/cg-logo-300.png'

  // --------------------------------------------

  const { userAgent } = window.navigator
  const onAndroidDevice = /Android/i.test(userAgent)
  const onAppleDevice = /iPhone|iPod|iPad/i.test(userAgent)

  // --------------------------------------------

  function skip() {
    preferencesStore.skipHomeScreenPrompt()
    navigateTo('/')
  }
</script>

<svelte:head>
  <title>CG Pay - Add to Home Screen</title>
</svelte:head>

<section id='home-screen-instructions'>
  <div class="wrapper">
    <img src= { cgLogo } alt="Common Good logo" />
    <h1>Add to Home Screen</h1>
    
    { #if onAppleDevice }
      <AppleInstructions { skip } />
    { /if }

    { #if onAndroidDevice }
      <AndroidInstructions { skip } />
    { /if }
  </div>
</section>

<style lang='stylus'>
  h1
    text(lg)
    font-weight bold
    margin 0 0 $s2
  
  img
    margin 0 0 $s2
    width 6rem

  .wrapper
    flexCenter(column)
    background $white
    border solid 1px $black
    margin $s2
    padding: $s2 $s2 $s3
</style>
