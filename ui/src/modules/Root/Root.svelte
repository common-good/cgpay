<script>
  import queryString from 'query-string'
  import { Router, navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'

  import accountStore from '../Account/account.store.js'

  import HomeScreenInstructions from '../HomeScreenInstructions/HomeScreenInstructions.svelte'
  import Pay from '../Pay/Pay.svelte'
  import SignIn from '../Account/SignIn/SignIn.svelte'

  // --------------------------------------------

  async function authenticated() {
    return $accountStore.account.token !== null
  }

  async function validateToken() {
    const token = $accountStore.account?.token

    if (token !== null) {
      const response = await fetch(`${ __membersApi__ }/accounts?${ queryString.stringify({ token }) }`)

      try {
        if (!response.ok) {
          accountStore.clear()
          navigateTo('/')
        }
      }

      catch (error) {
        // Handle no server access.
        console.log(error)
      }
    }
  }

  // --------------------------------------------

  const routes = [
    {
      name: '/',
      component: HomeScreenInstructions,
    },

    {
      name: '/pay',
      component: Pay,

      onlyIf: {
        guard: authenticated,
        redirect: '/sign-in'
      }
    },

    {
      name: '/sign-in',
      component: SignIn
    }
  ]

  // --------------------------------------------

  onMount(validateToken)
</script>

<Router { routes } />
