<script>
  import queryString from 'query-string'
  import { onMount } from 'svelte'

  import store from '#app.store.js'

  import SelectBusiness from './SelectBusiness/SelectBusiness.svelte'

  // --------------------------------------------

  let businessOptions = []
  let linkedBusiness
  let message
  let ready = false

  // --------------------------------------------

  function handleSelectBusiness(event) {
    linkedBusiness = event.detail
    message = `${ linkedBusiness.name } successfully linked.`
  }

  // --------------------------------------------

  onMount(async () => {
    try {
      const { identifier } = $store.auth.account
      const query = queryString.stringify({ identifier })
      const response = await fetch(`${ __membersApi__ }/businesses?${ query }`)

      if (response.ok) {
        const { businesses } = await response.json()
 
        // TODO: Handle edge case of no businesses,
        // if this is a possible case.

        if (businesses.length === 1) {
          linkedBusiness = businesses[0]
          store.business.link(linkedBusiness)
          message = `${ linkedBusiness.name } automatically linked.`
        }

        if (businesses.length > 1) {
          businessOptions = businesses
        }

        ready = true
      }

      else {
        // TODO: Handle an error response from the server.
      }
    }

    catch (error) {
      // TODO: Handle server unavailable.
    }
  })
</script>

<svelte:head>
  <title>CG Pay - Link Account</title>
</svelte:head>

<section id='link-account'>
  { #if !ready }
    <p>Finding your business...</p>
  { /if }

  { #if ready }
    { #if linkedBusiness }
      <section id='link-account-automatic'>
        <div class='link-account-content'>
          <h1>{ message }</h1>
          <p>You can now charge customers as { linkedBusiness.name }.</p>
        </div>

        <a class='link-account-action' href='/scan'>Scan QR Code</a>
      </section>

    { :else }
      <SelectBusiness { businessOptions } on:complete={ handleSelectBusiness } />
    { /if }
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
