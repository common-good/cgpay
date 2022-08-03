<script>
  import { navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'

  import AndroidInstructions from './AndroidInstructions/AndroidInstructions.svelte'
  import AppleInstructions from './AppleInstructions/AppleInstructions.svelte'
  import preferencesStore from '../Preferences/preferences.store.js'

  // --------------------------------------------

  const { userAgent } = window.navigator
  const onAndroidDevice = /Android/i.test(userAgent)
  const onAppleDevice = /iPhone|iPod|iPad/i.test(userAgent)

  // --------------------------------------------

  function skip() {
    preferencesStore.skipHomeScreenPrompt()
    navigateTo('/pay')
  }

  // --------------------------------------------

  onMount(() => {
    const hasDismissedPrompt = $preferencesStore.homeScreenPrompt.skipped
    const onMobileDevice = onAndroidDevice || onAppleDevice

    if (!onMobileDevice || hasDismissedPrompt) {
      navigateTo('/pay')
    }
  })
</script>

<svelte:head>
  <title>CG Pay - Add to Home Screen</title>
</svelte:head>

<section id='home-screen-instructions'>
  <h1>Add to Home Screen</h1>

  { #if onAppleDevice }
    <AppleInstructions { skip } />
  { /if }

  { #if onAndroidDevice }
    <AndroidInstructions { skip } />
  { /if }
</section>
