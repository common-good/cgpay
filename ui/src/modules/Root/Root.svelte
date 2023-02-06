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
  import ShowQr from '../ShowQr/ShowQr.svelte';

  // --------------------------------------------
  // Initialization Helpers

  function onlyIf(condition, elseGoTo) { return { guard: condition, redirect: elseGoTo } }
  function timeOut() {
    store.network.reset()
    setTimeout(timeOut, 3000)
  }

  function route(name, component, condition, elseGoTo, layout = LayoutStep) {
    return { name: name, component: component, layout: layout, onlyIf: onlyIf(condition, elseGoTo) }
  }

  // --------------------------------------------
  // Initialization

  onMount(async () => {
    window.addEventListener('offline', () => { store.network.setOnline(false) })
    window.addEventListener('online', () => { store.network.setOnline(true) })
    timeOut()
  })

  // --------------------------------------------

  const ready = store.myAccount.exists
  const unready = store.myAccount.empty

  const routes = [
    route('/', AddToHomeScreen, store.homeScreen.promptRequired, '/sign-in', LayoutIntro),
    route('/sign-in', SignIn, unready, '/scan', LayoutIntro),
    route('/link-account', LinkAccount, unready, '/scan'),
    route('/home', Home, ready, '/'),
    route('/scan', Scan, ready, '/sign-in'),
    route('/charge', Charge, ready, '/sign-in'),
  ]
</script>

<NetworkStatus />
<Router { routes } />
