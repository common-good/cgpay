<script>
  import cgLogo from '#modules/assets/cg-logo-300.png?webp'
  import st from'#store.js'
  import AndroidInstructions from '#modules/AndroidInstructions.svelte'
  import AppleInstructions from '#modules/AppleInstructions.svelte'
  import { onMount } from 'svelte'
  import u from '#utils.js'

  async function skip() {
    await st.setSawAdd()
    u.go('sign-in')
  }

  onMount(async () => {
    if (!u.addableToHome()) u.go('sign-in')
  })
</script>

<svelte:head>
  <title>CGPay - Add to Home Screen</title>
</svelte:head>

<section class="page card" id="add-to-home-screen">
  <header>
    <img src= { cgLogo } alt="Common Good logo" />
    <h1>Add to Home Screen</h1>
  </header>
  <p class="intro">We recommend adding CGPay to your home screen for a full app experience.</p>
    { #if u.isApple() }
      <AppleInstructions { skip } />
    { /if }

    { #if u.isAndroid() }
      <AndroidInstructions { skip } />
    { /if }
</section>

<style lang='stylus'>
  @import '../styles/AddToHomeScreen.styl'
</style>
