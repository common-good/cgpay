<script>
  import queryString from 'query-string'
  import { onMount } from 'svelte'
  import store from '#store.js'
  import { dlg, goHome } from '#utils.js'
  import SelectAccount from './SelectAccount/SelectAccount.svelte'
  import Modal from '../Modal.svelte'; let m0, m1, m2
// FAILS  import { page } from '$app/stores'

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  // --------------------------------------------

  let accountOptions = []
  let size = 4 // number of choices to show without scrolling (fails on Android)

  let myAccount
  let ready = false
  const accounts = $store.choices

    
  // --------------------------------------------

  function er(msg) { ({ m0, m1 } = dlg('Alert', msg, 'OK', () => m0 = false)); m0=m0; m1=m1 } 

  function gotAccount(ev) {
    myAccount = accounts[ev.detail]
    store.myAccount.setChoices(null) // don't leave this lying around
    store.myAccount.set(myAccount)
    goHome('This device is now connected to your Common Good account.')
  }

  onMount(async () => {
    ready = true
    if (accounts.length === 1) {
      gotAccount({detail: 0}) // simulate event (selection of this option in a <select>)
    } else if (accounts.length > 1) {
      for (let i = 0; i < accounts.length; i++) {
        accountOptions[i] = {id: i, name: accounts[i].name}
      }
      size = Math.min(size, accounts.length)
    } else {
      er('Your account is not yet active. Sign in at CommonGood.earth to finish opening your account.')
    }
  })
</script>

<svelte:head>
  <title>CGPay - Link Account</title>
</svelte:head>

<section id='link-account'>
  { #if ready }
    { #if myAccount }
        <div class='link-account-content'>
          <h1>Account linked</h1>
          <p>This account is now linked to<br /><span class="bold">{$store.myAccount.name}</span></p>
          <p>You are ready to charge customers!</p>
        </div>

        <a class='link-account-action' href='/scan'>Scan QR Code</a>

    { :else }
      <SelectAccount { accountOptions } { size } on:complete={ gotAccount } />
    { /if }
  { :else }
    <p>Finding your business...</p>
  { /if }
</section>

<Modal m0={m0} on:m1={m1} on:m2={m2} />

<style lang='stylus'>
  @import './LinkAccount.styl'

  section
    display flex
    flex-direction column
    justify-content space-between
    width 100%
    height 100%

  .bold
    font-weight 600

  .link-account-action
    linkAccountAction()

  .link-account-content
    linkAccountContent()
</style>
