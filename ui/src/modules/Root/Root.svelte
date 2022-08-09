<script>
  import queryString from 'query-string'
  import { Router } from 'svelte-router-spa'
  import { onMount } from 'svelte'

  import store from '#app.store.js'

  import AddToHomeScreen from '#modules/AddToHomeScreen/AddToHomeScreen.svelte'
  import Pay from '#modules/Pay/Pay.svelte'
  import SignIn from '#modules/Account/SignIn/SignIn.svelte'

  // --------------------------------------------
  // Initialization Helpers

  async function validateToken() {
    if (store.auth.isAuthenticated()) {
      const query = queryString.stringify({ token: $store.auth.token })
      const response = await fetch(`${ __membersApi__ }/accounts?${ query }`)

      try {
        if (!response.ok) {
          store.auth.signOut()
        }

        if (response.ok) {
          const { account, token } = await response.json()
          store.auth.signIn({ account, token })
        }
      }

      catch (error) {
        // TODO: Handle and test no server access.
        console.error(error)
      }
    }
  }

  // --------------------------------------------
  // Initialization

  onMount(async () => {
    await validateToken()

    window.addEventListener('offline', store.network.setOffline)

    window.addEventListener('online', () => {
      store.network.setRestored()
      setTimeout(store.network.reset, 3000)
    })

    if (window.navigator.onLine) {
      store.network.setOnline()
    }

    if (!window.navigator.onLine) {
      store.network.setOffline()
    }
  })

  // --------------------------------------------
  // Route Guards

  function promptRequired() {
    const hasNotSkippedPrompt = $store.homeScreen.skipped === false
    const onMobileDevice = [ 'Apple', 'Android' ].includes($store.deviceType)

    return onMobileDevice && hasNotSkippedPrompt
  }

  // --------------------------------------------
  // Routes

  const routes = [
    {
      name: '/',
      component: AddToHomeScreen,

      onlyIf: {
        guard: promptRequired,
        redirect: '/pay'
      }
    },

    {
      name: '/pay',
      component: Pay,

      onlyIf: {
        guard: store.auth.isAuthenticated,
        redirect: '/sign-in'
      }
    },

    {
      name: '/sign-in',
      component: SignIn,

      onlyIf: {
        guard: store.auth.isNotAuthenticated,
        redirect: '/pay'
      }
    }
  ]
</script>

<Router { routes } />
