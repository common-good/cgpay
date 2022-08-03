<script>
  import { Router } from 'svelte-router-spa'

  import preferencesStore from '../Preferences/preferences.store.js'

  import HomeScreenInstructions from '../HomeScreenInstructions/HomeScreenInstructions.svelte'
  import Pay from '../Pay/Pay.svelte'

  // --------------------------------------------

  function promptConsidered() {
    const hasDismissedPrompt = $preferencesStore.homeScreenPrompt.skipped
    const onMobileDevice = /Android|iPhone|iPod|iPad/i.test(window.navigator.userAgent)

    return !onMobileDevice || hasDismissedPrompt
  }

  // --------------------------------------------

  const routes = [
    {
      name: '/',
      component: Pay,

      onlyIf: {
        guard: promptConsidered,
        redirect: '/home-screen-instructions'
      }
    },

    {
      name: '/home-screen-instructions',
      component: HomeScreenInstructions
    }
  ]
</script>

<Router { routes } />
