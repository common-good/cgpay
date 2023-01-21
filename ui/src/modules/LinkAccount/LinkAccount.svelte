<script>
  import queryString from 'query-string'
  import { onMount } from 'svelte'
  import store from '#store.js'
  import { htmlQuote } from '#utils.js'
  import SelectAccount from './SelectAccount/SelectAccount.svelte'
  import Modal from '../Modal.svelte'
// FAILS  import { page } from '$app/stores'

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  // --------------------------------------------

  let accountOptions = []
  let myAccount
  let message
  let ready = false
  let erMsg = ''
  let accounts
    
  // --------------------------------------------

  function gotAccount(ev) {
    myAccount = accounts[ev.detail]
    store.myAccount.set(myAccount)
    message = 'This device is now linked' + htmlQuote(`to ${myAccount.name}.`)
  }

  // --------------------------------------------

  onMount(async () => {
    accounts = store.accountChoices.get()

    if (accounts.length === 1) {
      gotAccount({detail: 0}) // simulate event (selection of this option in a <select>)
    } else if (accounts.length > 1) {
      for (let i = 0; i < accounts.length; i++) {
        accountOptions[i] = {id: i, name: accounts[i].name}
      }
    } else {
//      erMsg = 'You do not have access to any company account. Ask a manager of your company account to connect your account and give you the appropriate permissions.'
      erMsg = 'Your account is not yet active. Sign in at CommonGood.earth to finish opening your account.'
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
          <h1>{@html message }</h1>
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

<Modal show={erMsg}
  title="Alert" text={erMsg} labels="OK, "
  on:fn1={ () => { erMsg = '' }}
/>

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
