<script>
  import queryString from 'query-string'
  import { onMount } from 'svelte'

  import store from '#app.store.js'

  import SelectAccount from './SelectAccount/SelectAccount.svelte'

  // --------------------------------------------

  let accountOptions = []
  let myAccount
  let message
  let ready = false
  let errorMessage
  let accounts
    
  // --------------------------------------------

  function gotAccount(e) {
    myAccount = accounts[e.detail]
    store.myAccount.set(myAccount)
    console.log($store.myAccount)
    message = `This device is now linked to ${ myAccount.name }.`
  }

  // --------------------------------------------

  onMount(async () => {
    accounts = store.accountChoices.get() // JSON.parse(getCookie('accountChoices'))
    console.log(accounts);

    if (accounts.length === 1) {
      gotAccount({detail: accounts[0]}) // simulate selection of the only option in a <select>
    } else if (accounts.length > 1) {
      for (let i = 0; i < accounts.length; i++) {
        accountOptions[i] = {id: i, name: accounts[i].name}
      }
    } else {
      errorMessage = `You do not have access to any company account. Ask a manager of your company account to connect your account and give you the appropriate permissions.`
    }
    ready = true
  })
</script>

<svelte:head>
  <title>CG Pay - Link Account</title>
</svelte:head>

<section id='link-account'>
  { #if ready }
    { #if myAccount }
      <section id='link-account-automatic'>
        <div class='link-account-content'>
          <h1>{ message }</h1>
          <p>You are ready to charge customers!</p>
        </div>

        <a class='link-account-action' href='/scan'>Scan QR Code</a>
      </section>

    { :else }
      <SelectAccount { accountOptions } on:complete={ gotAccount } />
    { /if }
  { :else }
    <p>Finding your business...</p>
  { /if }
</section>

<style lang='stylus'>
  @import './LinkAccount.styl'

  #link-account
    display flex
    flex-direction column
    justify-content space-between
    width 100%

    .link-account-action
      linkAccountAction()

    .link-account-content
      linkAccountContent()
</style>
