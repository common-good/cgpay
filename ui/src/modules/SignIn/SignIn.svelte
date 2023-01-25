<script>
  import queryString from 'query-string'
  import { navigateTo } from 'svelte-router-spa'
  import { dlg, timedFetch, isTimeout } from '#utils.js'
  import cgLogo from '#modules/Root/assets/cg-logo-300.png?webp'
  import store from '#store.js'
  import Modal from '../Modal.svelte'; let m0, m1

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  // --------------------------------------------

  const credentials = {
    identifier: 'newaad', // set these for now, to make debugging much faster
    password: 'Newaad1!'
  }

  let statusMsg = ''

  // --------------------------------------------

  function showEr(msg) { ({ m0, m1 } = dlg('Alert', msg, 'OK', () => m0 = false)); m0=m0; m1=m1 }

  async function signIn() {
    statusMsg = 'Finding your account(s)...'
    try {
      const query = queryString.stringify(credentials)
      const { result } = await timedFetch(`accounts?${ query }`)
      console.log(result)
      await store.accountChoices.set(result.accounts)
      navigateTo('/link-account')
    } catch (er) {
      store.network.reset()
      if (isTimeout(er) || !store.network.online) {
        showEr('The server is unavailable. Check your internet connection and try again.')
      } else {
        showEr('We couldn\'t find an account with that information. Please try again.')
      }
    }
  }
</script>

<svelte:head>
  <title>CG Pay - Sign In</title>
</svelte:head>

<section id='sign-in' on:submit|preventDefault={ signIn }>
  <header>
    <img src= { cgLogo } alt='Common Good Logo' />
    <h1>CG Pay</h1>
  </header>

  <h2>Sign In</h2>

  { #if $store.network.offline }
    <div id='sign-in-offline'>
      <p>Please connect to the internet to sign in.</p>
    </div>
  { :else }
    <form>
      <input type='text' placeholder='Account ID or email address' bind:value={ credentials.identifier } required />
      <input type='password' placeholder='Password' bind:value={ credentials.password } required />
      <button type='submit'>Sign In</button>
    </form>
    <p>{ statusMsg }</p>
  { /if }
</section>

<Modal m0={m0} on:m1={m1} />

<style lang='stylus'>
  img
    clampSize(15vw, 75px)
    margin 0 $s2 0 0

  h1
    font-weight 600
    text xl

  h2
    font-weight 600
    margin $s4 0
    text lg
    text-align center

  header
    contentCentered()

  input
    cgField()

  button
    cgButton()

  #sign-in-error
    margin 0 0 $s2
    text-align center

  #sign-in-offline
    cgCard()
</style>
