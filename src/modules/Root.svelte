<script>
  import { Router, navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import store from '#store.js'
  import u from '#utils.js'
  import c from '#constants.js'

  import Empty from '#modules/_Empty.svelte' // for testing
  import AddToHomeScreen from '#modules/AddToHomeScreen.svelte'
  import Home from '#modules/Home.svelte'
  import Charge from '#modules/Charge.svelte'
  import LinkAccount from '#modules/LinkAccount.svelte'
  import Scan from '#modules/Scan.svelte'
  import SignIn from '#modules/SignIn.svelte'
  import Comment from '#modules/Comment.svelte'
  import LayoutIntro from '#modules/LayoutIntro.svelte'
  import LayoutStep from '#modules/LayoutStep.svelte'

  // Initialization Helpers

  store.fromTester().then() // we must check for tester instructions before doing anything

  function timeOut() {
    store.fromTester().then()
    store.resetNetwork()
    setTimeout(timeOut, c.networkTimeoutMs)
    if ($store.lastOp && u.now() - $store.lastOp > c.opTimeout) navigateTo('/home')
  }

  function onlyIf(condition, elseGoTo) { return { guard: condition, redirect: elseGoTo } }

  function route(name, component, condition, elseGoTo, layout = LayoutStep) {
    return { name: name, component: component, layout: layout, onlyIf: onlyIf(condition, elseGoTo) }
  }

  const needSignin = ( () => u.empty($store.choices) && !store.linked() )
  const needLink = ( () => !store.linked() )
  const gotQr = ( () => $store.qr !== null )

  const routes = [
    route('/empty', Empty, true, null, LayoutIntro), // for testing
    route('/', AddToHomeScreen, u.addableToHome, '/sign-in', LayoutIntro),
    route('/sign-in', SignIn, needSignin, '/link-account', LayoutIntro),
    route('/link-account', LinkAccount, needLink, '/home'),
    route('/home', Home, store.linked, '/'),
    route('/scan', Scan, store.linked, '/'),
    route('/charge', Charge, gotQr, '/'),
    route('/comment', Comment, store.linked, '/')
  ]

  onMount(async () => {
    addEventListener('offline', () => { store.setOnline(false) })
    addEventListener('online', () => { store.setOnline(true) })
    timeOut()
  })

</script>

<Router { routes } />
