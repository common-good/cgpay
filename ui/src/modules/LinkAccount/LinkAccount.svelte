<script>
  import queryString from 'query-string'
  import { onMount } from 'svelte'
  import store from '#store.js'
  import { dlg, goHome } from '#utils.js'
  import SelectAccount from './SelectAccount/SelectAccount.svelte'
  import Modal from '../Modal.svelte'; let m0, m1, m2

  // --------------------------------------------

  let accountOptions = []
  let size = 4 // number of choices to show without scrolling (fails on Android)

  let myAccount
  let ready = false
  const accounts = $store.choices
  
  // --------------------------------------------

  function er(msg) { ({ m0, m1 } = dlg('Alert', msg, 'Close', () => m0 = false)); m0=m0; m1=m1 } 

  function gotAccount(ev) {
    myAccount = accounts && accounts[ev.detail]
    store.setMyAccount(myAccount)
    goHome(`This device is now linked to your Common Good account: ${myAccount?.name}.`)
  }

  onMount(async () => {
    ready = true
    if (accounts?.length) {
      for (let i = 0; i < accounts.length; i++) {
        accountOptions[i] = {id: i, name: accounts[i].name}
      }
      size = Math.min(size, accounts.length + 1)
    } else {
      er('Your account is not yet active. Sign in at CommonGood.earth to finish opening your account.')
    }
  })
</script>

<svelte:head>
  <title>CGPay - Link Account</title>
</svelte:head>

<section id='link-account'>
  <h1>Link Account</h1>
  { #if ready }
    <SelectAccount { accountOptions } { size } on:complete={ gotAccount } />
  { :else }
    <div class="loading">
      <p>Loading your accounts...</p>
    </div>
  { /if }
</section>

<Modal m0={m0} on:m1={m1} on:m2={m2} />

<style lang='stylus'>
  section
    display flex
    flex-direction column
    align-items center
    justify-content space-between
    width 100%
    height 100%

  .loading
    height 100%
    display flex
    align-items center
    font-style italic
    margin-bottom $s5
</style>
