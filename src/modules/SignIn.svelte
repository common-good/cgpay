<script>
  import st from'#store.js'
  import u from '#utils.js'
  import cgLogo from '#modules/assets/cg-logo-300.png?webp'

  const credentials = {}
  let statusMsg = ''

  function showEr(msg) { u.alert(msg); statusMsg = '' }

  async function signIn() {
    statusMsg = 'Finding your account(s)...'
    try {
      const res = await u.postRequest('accounts', credentials)
      st.setAcctChoices(res.accounts)
      st.setCorrupt(null) // retry any failed (corrupt) transactions
      if (res.accounts.length > 1) {
        u.go('link-account')
      } else {
        // Skip /link-account and use individual account settings
        st.setMe(res.accounts[0])
        st.setShowDash(true)
        st.setPayOk(true)
        st.setAllowShow(true)
        u.go('home')
      }
    } catch (er) {
      st.resetNetwork()
      if (u.isTimeout(er) || !$st.online) {
        showEr('The server is unavailable. Check your internet connection and try again.')
      } else if (er.message == 403) { // forbidden
        showEr('That account is not completely set up. Sign back in at CommonGood.earth to complete it.')
      } else {
        console.log(er)
        showEr('We could not find an account with that information. Please try again.')
      }
    }
  }
</script>

<svelte:head>
  <title>CGPay - Sign In</title>
</svelte:head>

<section class="page card" id="sign-in">
  <header>
    <img src= { cgLogo } alt='Common Good Logo' />
    <h1>CGPay{ u.realData() ? '' : ' DEMO' }</h1>
  </header>

  <div class='content'>
    <h2>Sign In</h2>
    <form on:submit|preventDefault={signIn}>
      <label class="visuallyhidden" for="account-id">Account ID or Email Address</label>
      <input data-testid="input-identifier" name="account-id" type="text" placeholder="Account ID or Email Address" autocomplete="off" autocapitalize="off" bind:value={ credentials.identifier } required />
      <label class="visuallyhidden" for="password">Password</label>
      <input data-testid="input-password" name="password" type="password" placeholder="Password" autocomplete="off" autocapitalize="off" bind:value={ credentials.password } required />
      <button data-testid="btn-signin" type="submit">Sign In</button>
      <a data-testid="lnk-reset" href="https://new.commongood.earth/settings/password/" target="_blank">Reset password</a>
       <a class="signup" data-testid="lnk-signup" href="https://new.commongood.earth/signup" target="_blank">Not a member yet? Sign Up</a>
      <p class="status">{statusMsg}</p>
    </form>
  </div>
</section>

<style lang='stylus'>
  a
    padding 0 $s-1
    color $c-blue
    text-decoration underline
    text-underline-offset 1px
    margin-bottom $s-2
    width fit-content
    &.signup
      margin-bottom $s1

  button
    cgButton()
    margin-bottom $s2

  form
    display flex
    flex-direction column

  h2
    margin-bottom $s0

  header
    contentCentered()
    margin-bottom $s5

  img
    width 75px
    margin 0 $s2 0 0

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
    align-items center

  .status
    height 24px
    font-style italic
    letter-spacing 0.0125rem
    text-align center
</style>
