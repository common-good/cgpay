<script>
  import queryString from 'query-string'
  import { Router } from 'svelte-router-spa'
  import { onMount } from 'svelte'

  import store from '#app.store.js'

  import AddToHomeScreen from '#modules/AddToHomeScreen/AddToHomeScreen.svelte'
  import Charge from '#modules/Charge/Charge.svelte'
  import LinkAccount from '#modules/LinkAccount/LinkAccount.svelte'
  import NetworkStatus from '#modules/NetworkStatus/NetworkStatus.svelte'
  import Scan from '#modules/Scan/Scan.svelte'
  import SignIn from '#modules/SignIn/SignIn.svelte'

  import LayoutIntro from './LayoutIntro/LayoutIntro.svelte'
  import LayoutStep from './LayoutStep/LayoutStep.svelte'

  // --------------------------------------------
  // Initialization Helpers

  async function sendChargeRequest({ transaction }) {
    try {
      const response = await fetch(`${ __membersApi__ }/charges`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(transaction)
      })

      if (!response.ok) {
        throw new Error('Response was not OK.')
      }
    }

    catch (error) {
      throw new Error('Could not complete charge request.')
    }
  }

  // --------------------------------------------
  // Initialization

  onMount(async () => {
    window.addEventListener('offline', store.network.setOffline)

    window.addEventListener('online', () => {
      store.network.setRestored()
      store.transactions.flush({ sendChargeRequest })
      setTimeout(store.network.reset, 3000)
    })

    if (window.navigator.onLine) {
      store.network.setOnline()
      store.transactions.flush({ sendChargeRequest })
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
      layout: LayoutIntro,

      onlyIf: {
        guard: store.homeScreen.promptRequired,
        redirect: '/sign-in'
      }
    },
    
    {
      name: '/sign-in',
      component: SignIn,
      layout: LayoutIntro,

      onlyIf: {
        guard: !store.myAccount.has,
        redirect: '/scan'
      }
    },

    {
      name: '/link-account',
      component: LinkAccount,
      layout: LayoutStep,

      onlyIf: {
        guard: !store.myAccount.has,
        redirect: '/scan'
      }
    },
    
    {
      name: '/scan',
      component: Scan,
      layout: LayoutStep,

      onlyIf: {
        guard: store.myAccount.has,
        redirect: '/sign-in'
      }
    },

    {
      name: '/charge',
      component: Charge,
      layout: LayoutStep,

      onlyIf: {
        guard: store.myAccount.has,
        redirect: '/sign-in'
      }
    },

  ]
</script>

<NetworkStatus />
<Router { routes } />
