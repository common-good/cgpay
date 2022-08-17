<script>
  import queryString from 'query-string'
  import { navigateTo } from 'svelte-router-spa'

  import cgLogo from '#modules/Root/assets/cg-logo-300.png?webp'
  import store from '#app.store.js'

  // --------------------------------------------

  const credentials = {
    identifier: null,
    password: null
  }

  let errorMessage = null

  // --------------------------------------------

  async function signIn() {
    try {
      const query = queryString.stringify(credentials)
      const response = await fetch(`${ __membersApi__ }/accounts?${ query }`)

      if (response.ok) {
        const { account, token } = await response.json()

        store.auth.signIn({ account, token })
        navigateTo('/link-account')
      }

      else {
        errorMessage = `We couldn't find an account with that information. Please try again.`
      }
    }

    catch (error) {
      // TODO: Handle and test no server access.
      console.error(error)
      errorMessage = 'We could not complete your request.'
    }
  }
</script>

<svelte:head>
  <title>CG Pay - Sign In</title>
</svelte:head>

<section id='sign-in' on:submit|preventDefault={ signIn }>
  <header>
    <img class='logo' src= { cgLogo } alt="Common Good logo" />
    <h1>CG Pay</h1>
  </header>
  <h2>Sign In</h2>

  { #if errorMessage }
    <p id='sign-in-error'>{ errorMessage }</p>
  { /if }

  { #if $store.network.offline }
    <div class="card">
      <p>Welcome to CG Pay!</p>
      <p>Please connect to the internet to enable Sign In.</p>
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
  button
    buttonPrimary()
    width 100%

  h1
    font-weight 600
    text xl

  h2
    font-weight 600
    text lg

  header
    flexCenter row
    margin 0 0 4rem

  input
    input null
    width 100%
    &:last-of-type
      margin-bottom $s3

  form
    flexCenter column
    margin 4rem 0 0
    width 100%

  p
    margin 0 0 1rem

  section
    flexCenter column
    padding $s4 $s2 0

  .card
    background $gray-light
    border solid 1px $black
    border-radius 5px
    margin $s3 0 0
    padding $s2 $s2 $s1

  .logo
    margin 0 20px 0 0
    width 80px
</style>
