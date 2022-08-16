<script>
  import queryString from 'query-string'
  import { navigateTo } from 'svelte-router-spa'

  import store from '#app.store.js'

  import cgLogo from '../../../assets/cg-logo-300.png'

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
    <h1>CGPay</h1>
  </header>
  <h2>Sign In</h2>

  { #if errorMessage }
    <p id='sign-in-error'>{ errorMessage }</p>
  { /if }

  <form>
    <input type='text' placeholder='Account ID or email address' bind:value={ credentials.identifier } required />
    <input type='password' placeholder='Password' bind:value={ credentials.password } required />
    <button type='submit'>Sign In</button>
  </form>
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
    margin 0 0 4rem
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
    width 100%

  section
    flexCenter column
    padding $s4 $s2 0

  .logo
    margin 0 20px 0 0
    width 80px
</style>
