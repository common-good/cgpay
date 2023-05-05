<script>
  import { Router, navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import st from'#store.js'
  import u from '#utils.js'
  import c from '#constants.js'

  import Empty from '#modules/_Empty.svelte' // for testing
  import AddToHomeScreen from '#modules/AddToHomeScreen.svelte'
  import Home from '#modules/Home.svelte'
  import Tx from '#modules/Tx.svelte'
  import LinkAccount from '#modules/LinkAccount.svelte'
  import Scan from '#modules/Scan.svelte'
  import SignIn from '#modules/SignIn.svelte'
  import Comment from '#modules/Comment.svelte'
  import LayoutIntro from '#modules/LayoutIntro.svelte'
  import LayoutStep from '#modules/LayoutStep.svelte'

  // Initialization Helpers

  st.fromTester().then() // we must check for tester instructions before doing anything

  function timeOut() {
    st.fromTester().then()
    st.resetNetwork()
    setTimeout(timeOut, c.networkTimeoutMs)
    if ($st.timeout && !st.setTimeout()) u.go('home')
  }

  function onlyIf(condition, elseGoTo) { return { guard: condition, redirect: elseGoTo } }

  function route(name, component, condition, elseGoTo, layout = LayoutStep) {
    return { name: name, component: component, layout: layout, onlyIf: onlyIf(condition, elseGoTo) }
  }

  const needSignin = ( () => u.empty($st.choices) && !st.linked() )
  const needLink = ( () => !st.linked() )
  const gotQr = ( () => $st.qr !== null )

  const routes = [
    route('/empty', Empty, true, null, LayoutIntro), // for testing
    route('/', AddToHomeScreen, u.addableToHome, '/sign-in', LayoutIntro),
    route('/sign-in', SignIn, needSignin, '/link-account', LayoutIntro),
    route('/link-account', LinkAccount, needLink, '/home'),
    route('/home', Home, st.linked, '/'),
    route('/scan', Scan, st.linked, '/'),
    route('/tx', Tx, gotQr, '/'),
    route('/comment', Comment, st.linked, '/')
  ]

  onMount(async () => {
    addEventListener('offline', () => { st.setOnline(false) })
    addEventListener('online', () => { st.setOnline(true) })
    timeOut()
  })

</script>

<Router { routes } />
