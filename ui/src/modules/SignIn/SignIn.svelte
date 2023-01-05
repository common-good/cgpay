<script>
  import queryString from 'query-string'
  import { navigateTo } from 'svelte-router-spa'

  import cgLogo from '#modules/Root/assets/cg-logo-300.png?webp'
  import store from '#app.store.js'

  // --------------------------------------------

  const credentials = {
    identifier: 'newaad', // set these for now, to make debugging much faster
    password: 'Newaad1!'
  }

  let errorMessage
  let accountChoices = {}

  // --------------------------------------------

  async function signIn() {
    errorMessage = 'Finding your account(s)...'
    try {
      const query = queryString.stringify(credentials)
      const res = await fetch(`${ __membersApi__ }/accounts?${ query }`)

      if (res.ok) {
        const obj = await res.json()
        store.accountChoices.set(obj.accounts)
        navigateTo('/link-account')
      } else {
        errorMessage = `We couldn't find an account with that information. Please try again.`
      }
    } catch (error) {
      console.log(error);
      errorMessage = `The server is unavailable. Check your internet connection and try again?`
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

  { #if errorMessage }
    <p id='sign-in-error'>{ errorMessage }</p>
  { /if }

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
  { /if }
</section>

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
