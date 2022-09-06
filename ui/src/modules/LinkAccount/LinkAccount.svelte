<script>
  import queryString from 'query-string'
  import { onMount } from 'svelte'

  import store from '#app.store.js'

  import SelectAccount from './SelectAccount/SelectAccount.svelte'

  // --------------------------------------------

  let message

  $: linkedAccount = $store.accounts.linked
  $: possibleAccounts = $store.accounts.possible

  // --------------------------------------------

  function handleSelectAccount(event) {
    store.accounts.link(event.detail)
    message = `${ $store.accounts.linked.name } successfully linked.`
  }

  // --------------------------------------------

  onMount(async () => {
    if (possibleAccounts.length === 1) {
      store.accounts.link(possibleAccounts[0])
      message = `${ $store.accounts.linked.name } automatically linked.`
    }
  })
</script>

<svelte:head>
  <title>CG Pay - Link Account</title>
</svelte:head>

<section id='link-account'>
  { #if linkedAccount }
    <section id='link-account-automatic'>
      <div class='link-account-content'>
        <h1>{ message }</h1>
        <p>You can now charge customers as { linkedAccount.name }.</p>
      </div>

      <a class='link-account-action' href='/scan'>Scan QR Code</a>
    </section>

  { :else }
    <SelectAccount options={ possibleAccounts } on:complete={ handleSelectAccount } />
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
