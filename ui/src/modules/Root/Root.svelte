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
    store.resetNetwork()
    setTimeout(timeOut, 3000)
  }

  function route(name, component, condition, elseGoTo, layout = LayoutStep) {
    return { name: name, component: component, layout: layout, onlyIf: onlyIf(condition, elseGoTo) }
  }

  // --------------------------------------------
  // Initialization

  onMount(async () => {
    window.addEventListener('offline', () => { store.setOnline(false) })
    window.addEventListener('online', () => { store.setOnline(true) })
    timeOut()
  })

  // --------------------------------------------

  const notSignedIn = ( () => !store.isSignedIn() )

  const routes = [
    route('/', AddToHomeScreen, store.addableToHome, '/sign-in', LayoutIntro),
    route('/sign-in', SignIn, notSignedIn, '/home', LayoutIntro),
    route('/link-account', LinkAccount, notSignedIn, '/home'),
    route('/home', Home, store.isSignedIn, '/'),
    route('/scan', Scan, store.isSignedIn, '/sign-in'),
    route('/charge', Charge, store.isSignedIn, '/sign-in'),
  ]
</script>

<NetworkStatus />
<Router { routes } />
