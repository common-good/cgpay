<script>
  import queryString from 'query-string'
  import { navigateTo } from 'svelte-router-spa'
  import { dlg, timedFetch, isTimeout } from '#utils.js'
  import cgLogo from '#modules/assets/cg-logo-300.png?webp'
  import store from '#store.js'
  import Modal from '#modules/Modal.svelte'; let m0, m1

  // --------------------------------------------

//  const credentials = { identifier: 'newaad', password: 'Newaad1!' } // set these to make debugging much faster
  const credentials = {}

  let statusMsg = ''

  // --------------------------------------------

  function showEr(msg) { 
    ({ m0, m1 } = dlg('Alert', msg, 'Close', () => m0 = false)); m0=m0; m1=m1;
    statusMsg = ''
  }

  async function signIn() {
    statusMsg = 'Finding your account(s)...'
    try {
      const query = queryString.stringify(credentials)
      const { result } = await timedFetch(`accounts?${ query }`)

      if (result.accounts.length > 1) {
        store.setAcctChoices(result.accounts)
        navigateTo('/link-account')
      } else {
        store.setMyAccount(result.accounts[0])
        navigateTo('/home')
      }
    } catch (er) {
      store.resetNetwork()
      if (isTimeout(er) || !$store.online) {
        showEr('The server is unavailable. Check your internet connection and try again.')
      } else if (er.message == 403) { // forbidden
        showEr('That account is not completely set up. Sign back in at CommonGood.earth to complete it.')
      } else {
        showEr('We could not find an account with that information. Please try again.')
      }
    }
  }
</script>

<svelte:head>
  <title>CGPay - Sign In</title>
</svelte:head>

<section class='card' id='sign-in'>
  <header>
    <img src= { cgLogo } alt='Common Good Logo' />
    <h1>CGPay{ $store.testMode ? ' DEMO' : '' }</h1>
  </header>

  <div class='content'>
    <h2>Sign In</h2>
    <form on:submit|preventDefault={ signIn }>
      <label class='visuallyhidden' for='account-id'>Account ID or Email Address</label>
      <input name='account-id' type='text' placeholder='Account ID or Email Address' autocomplete='name' autocapitalize='off' bind:value={ credentials.identifier } required />
      <label class='visuallyhidden' for='password'>Password</label>
      <input type='password' placeholder='Password' autocomplete='current-password' autocapitalize='off' bind:value={ credentials.password } required />
      <button type='submit'>Sign In</button>
    </form>
    <p class="status">{ statusMsg }</p>
  </div>
</section>

<Modal m0={m0} on:m1={m1} />

<style lang='stylus'>
  button
    cgButton()

  h2
    margin-bottom $s1

  header
    contentCentered()

  img
    width 75px
    margin 0 $s2 0 0

  form
    margin-bottom $s2

  p 
    height 72px

  .card
    height 100%
    display flex
    flex-direction column
    align-items center
    background $c-blue-light
    box-shadow: 2px 2px 4px $c-gray-dark
    border-radius: 2%
    padding $s1

  .content
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column
    justify-content: center
    align-items: center

  .status
    font-style italic
    letter-spacing: 0.0125rem
</style>
