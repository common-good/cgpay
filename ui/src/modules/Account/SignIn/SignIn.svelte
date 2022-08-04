<script>
  import queryString from 'query-string'
  import { navigateTo } from 'svelte-router-spa'

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
        navigateTo('/pay')
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
  <h1>Sign In</h1>

  { #if errorMessage }
    <p id='sign-in-error'>{ errorMessage }</p>
  { /if }

  <form>
    <input type='text' placeholder='Account ID or email address' bind:value={ credentials.identifier } required />
    <input type='password' placeholder='Password' bind:value={ credentials.password } required />
    <button type='submit'>Sign In</button>
  </form>
</section>
