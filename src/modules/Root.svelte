<script>
  import { Router } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import st from'#store.js'
  import u from '#utils.js'
  import c from '#constants.js'

  import Empty from '#modules/_Empty.svelte' // for testing
  import AddToHomeScreen from '#modules/AddToHomeScreen.svelte'
  import Home from '#modules/Home.svelte'
  import TxStart from '#modules/TxStart.svelte'
  import Tx from '#modules/Tx.svelte'
  import LinkAccount from '#modules/LinkAccount.svelte'
  import Scan from '#modules/Scan.svelte'
  import SignIn from '#modules/SignIn.svelte'
  import Comment from '#modules/Comment.svelte'
  import Settings from '#modules/Settings.svelte'
  import LayoutIntro from '#modules/LayoutIntro.svelte'
  import Layout from '#modules/Layout.svelte'

  st.fromTester().then() // we must check for tester instructions before doing anything

  function timeOut() {
    st.fromTester().then()
    st.resetNetwork()
    setTimeout(timeOut, c.networkTimeoutMs)
    if ($st.timeout && !st.setTimeout()) u.go('home')
  }

  function onlyIf(condition, elseGoTo) { return { guard: condition, redirect: elseGoTo } }

  function route(name, component, condition, elseGoTo, layout = Layout) {
    return { name: name, component: component, layout: layout, onlyIf: onlyIf(condition, elseGoTo) }
  }

  const needSignin = ( () => u.empty($st.choices) && !st.linked() )
  const needLink = ( () => !st.linked() )
  const gotIntent = ( () => $st.intent !== null )

  const routes = [
    route('/empty', Empty, true, null, LayoutIntro), // for testing
    route('/', AddToHomeScreen, u.addableToHome, '/sign-in', LayoutIntro),
    route('/sign-in', SignIn, needSignin, '/link-account', LayoutIntro),
    route('/link-account', LinkAccount, needLink, '/home', LayoutIntro),
    route('/home', Home, st.linked, '/'),
    route('/scan', Scan, st.linked, '/'),
    route('/tx', Tx, gotIntent, '/'),
    route('/tx-start', TxStart, gotIntent, '/'),
    route('/comment', Comment, st.linked, '/'),
    route('/settings', Settings, () => !u.empty($st.choices), '/' ),
  ]

  onMount(async () => {
    addEventListener('offline', () => { st.setOnline(false) })
    addEventListener('online', () => { st.setOnline(true) })
    timeOut()
  })

</script>

<Router { routes } />
