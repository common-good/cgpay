<script>
  import queryString from 'query-string'
  import { Router } from 'svelte-router-spa'
  import { onMount } from 'svelte'

  import store from '#app.store.js'

  import AddToHomeScreen from '#modules/AddToHomeScreen/AddToHomeScreen.svelte'
  import LinkAccount from '#modules/LinkAccount/LinkAccount.svelte'
  import NetworkStatus from '#modules/NetworkStatus/NetworkStatus.svelte'
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
  // Routes

  const routes = [
    {
      name: '/',
      component: AddToHomeScreen,

      onlyIf: {
        guard: store.homeScreen.promptRequired,
        redirect: '/pay'
      }
    },

    {
      name: '/link-account',
      component: LinkAccount,

      onlyIf: {
        guard: store.auth.isAuthenticated,
        redirect: '/sign-in'
      }
    },

    {
      name: '/pay',
      component: Pay,

      onlyIf: {
        guard: store.business.isLinked,
        redirect: '/link-account'
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

<NetworkStatus />
<Router { routes } />
