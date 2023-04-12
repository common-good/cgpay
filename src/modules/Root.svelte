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

  if (u.fromTester()) store.fromTester()
  async function timeOut() {
    if (u.fromTester()) store.fromTester()
    await store.resetNetwork()
    setTimeout(timeOut, c.networkTimeoutMs)
    if ($store.lastOp && u.now() - $store.lastOp > c.opTimeout) { store.setLastOp(null); await navigateTo('/home') }
  }

  function onlyIf(condition, elseGoTo) { return { guard: condition, redirect: elseGoTo } }

  function route(name, component, condition, elseGoTo, layout = LayoutStep) {
    return { name: name, component: component, layout: layout, onlyIf: onlyIf(condition, elseGoTo) }
  }

  const notSignedIn = ( () => !store.isSignedIn() )

  const routes = [
    route('/empty', Empty, true, null, LayoutIntro), // for testing
    route('/', AddToHomeScreen, u.addableToHome, '/sign-in', LayoutIntro),
    route('/sign-in', SignIn, notSignedIn, '/home', LayoutIntro),
    route('/link-account', LinkAccount, notSignedIn, '/home'),
    route('/home', Home, store.isSignedIn, '/'),
    route('/scan', Scan, store.isSignedIn, '/sign-in'),
    route('/charge', Charge, store.isSignedIn, '/sign-in'),
    route('/comment', Comment, store.isSignedIn, '/sign-in')
  ]

  onMount(async () => {
    addEventListener('offline', async () => { await store.setOnline(false) })
    addEventListener('online', async () => { await store.setOnline(true) })
    timeOut()
  })

</script>

<Router { routes } />
