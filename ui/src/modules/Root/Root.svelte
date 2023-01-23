<script>
  import queryString from 'query-string'
  import { Router } from 'svelte-router-spa'
  import { onMount } from 'svelte'

  import store from '#store.js'
  import { sendTxRequest } from '#utils.js'

  import AddToHomeScreen from '#modules/AddToHomeScreen/AddToHomeScreen.svelte'
  import Home from '#modules/Home/Home.svelte'
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
  function timeOut() {
    store.network.reset()
    setTimeout(timeOut, 3000)
  }

  // --------------------------------------------
  // Initialization

  onMount(async () => {
    window.addEventListener('offline', () => { store.network.setOnline(false) })
    window.addEventListener('online', () => { store.network.setOnline(true) })
    timeOut()
  })

  // --------------------------------------------
  // Routes

  const routes = [
  
    {
      name: '/',
      component: AddToHomeScreen,
      layout: LayoutIntro,
      onlyIf: onlyIf(store.homeScreen.promptRequired, store.myAccount.exists() ? '/scan' : '/sign-in')
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
      name: '/home',
      component: Home,
      layout: LayoutStep,
      onlyIf: onlyIf(store.myAccount.exists, '/')
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
