<script>
  import queryString from 'query-string'
  import { onMount } from 'svelte'

  import NetworkStatus from '#modules/NetworkStatus/NetworkStatus.svelte'
  import store from '#app.store.js'

  // --------------------------------------------

  let automaticallyLinkedBusiness
  let businessOptions = []
  let manuallyLinkedBusiness
  let selectedBusiness

  let ready = false

  // --------------------------------------------

  function selectBusiness() {
    manuallyLinkedBusiness = selectedBusiness
    store.business.link(manuallyLinkedBusiness)
  }

  // --------------------------------------------

  onMount(async () => {
    // TODO: Should these requests be in a helper for
    // easier testing?
    try {
      const { identifier } = $store.auth.account
      const query = queryString.stringify({ identifier })
      const response = await fetch(`${ __membersApi__ }/businesses?${ query }`)

      if (response.ok) {
        const { businesses } = await response.json()
 
        // TODO: Handle edge case of no businesses.

        if (businesses.length === 1) {
          automaticallyLinkedBusiness = businesses[0]
        }

        if (businesses.length > 1) {
          businessOptions = businesses
        }

        ready = true
      }

      else {
        // TODO: Is this how we want to handle when the
        // server is not available?
        throw new Error()
      }
    }

    catch (error) {
      // TODO: Handle and test no server access.
      console.error(error)
    }
  })
</script>

<svelte:head>
  <title>CG Pay - Link Account</title>
</svelte:head>

<NetworkStatus />

<section id='link-account'>
  { #if ready }
    { #if automaticallyLinkedBusiness }
      <h1>{ automaticallyLinkedBusiness.name }</h1>
      <p>Your account has been automatically linked.</p>

    { :else if manuallyLinkedBusiness }
      <h1>{ manuallyLinkedBusiness.name } successfully linked.</h1>
      <p>You can now charge customers as { manuallyLinkedBusiness.name }.</p>

      <button>Scan QR Code</button>

    { :else }
      <h1>Link Account</h1>
      <p>Select a business account to link to CGPay on this device.</p>

      <form on:submit|preventDefault={ selectBusiness } >
        <label for='select-business'>Select Account:</label>

        <select id='select-business' bind:value={ selectedBusiness }>
          { #each businessOptions as business }
            <option value={ business }>{ business.name }</option>
          { /each }
        </select>

        <button type='submit'>Link Account</button>
      </form>
    { /if }
  { /if }

  { #if !ready }
    <p>Finding your business...</p>
  { /if }
</section>
