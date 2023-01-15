<script>
  import queryString from 'query-string'
  import { Router } from 'svelte-router-spa'
  import { onMount } from 'svelte'

  import store from '#store.js'
  import { sendTxRequest } from '#utils.js'

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

  function onlyIf(condition, elseGoTo) { return { guard: condition, redirect: elseGoTo } }

  // --------------------------------------------
  // Initialization

  onMount(async () => {
    window.addEventListener('offline', store.network.setOffline)

    window.addEventListener('online', () => {
      store.network.setRestored()
      store.transactions.flush({ sendTxRequest })
      setTimeout(store.network.reset, 3000)
    })

    if (window.navigator.onLine) {
      store.network.setOnline()
      store.transactions.flush({ sendTxRequest })
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
      onlyIf: onlyIf(store.homeScreen.promptRequired, '/sign-in')
    },
    
    {
      name: '/sign-in',
      component: SignIn,
      layout: LayoutIntro,
      onlyIf: onlyIf(!store.myAccount.exists, '/scan')
    },

    {
      name: '/link-account',
      component: LinkAccount,
      layout: LayoutStep,
      onlyIf: onlyIf(!store.myAccount.exists, '/scan')
    },
    
    {
      name: '/scan',
      component: Scan,
      layout: LayoutStep,
      onlyIf: onlyIf(store.myAccount.exists, '/sign-in')
    },

    {
      name: '/charge',
      component: Charge,
      layout: LayoutStep,
      onlyIf: onlyIf(store.myAccount.exists, '/sign-in')
    },

  ]
</script>

<NetworkStatus />
<Router { routes } />
