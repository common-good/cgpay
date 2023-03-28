<script>
  import { navigateTo } from 'svelte-router-spa'
  import store from '#store.js'
  import { dlg, postRequest, isTimeout } from '#utils.js'
  import cgLogo from '#modules/assets/cg-logo-300.png?webp'
  import Modal from '#modules/Modal.svelte'; let m0, m1

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
      const result = await postRequest('accounts', credentials)

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
      <a class="link" data-testid="reset-pw" href="https://new.commongood.earth/settings/password/" target="_blank">Reset password</a>
      <button data-testid="signin-btn" type='submit'>Sign In</button>
      <p class="status">{ statusMsg }</p>
    </form>
    <p class="sign-up">Not a member?</p>
    <a class="link-button" data-testid="signup-btn" href="https://new.commongood.earth/signup" target="_blank">Sign Up</a>
  </div>
</section>

<Modal m0={m0} on:m1={m1} />

<style lang='stylus'>
  button
    cgButtonSecondary()
    margin-bottom $s-2

  h2
    margin-bottom $s0

  header
    contentCentered()

  img
    width 75px
    margin 0 $s2 0 0

  form
    margin-bottom $s0

    input:last-of-type
      margin-bottom $s-2

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
    width 100%
    height 100%
    display flex
    flex-direction column
    justify-content center
    align-items center

  .link
    text(sm)
    display block
    color $c-blue
    margin-bottom $s0
    text-decoration underline
    text-underline-offset 1px

  .link-button
    cgButton()

  .sign-up
    align-self flex-start
    margin-bottom $s-2

  .status
    height 24px
    font-style italic
    letter-spacing 0.0125rem
    text-align center
</style>
