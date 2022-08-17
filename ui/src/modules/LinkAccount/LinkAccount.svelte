<script>
  import queryString from 'query-string'
  import { onMount } from 'svelte'

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
    try {
      const { identifier } = $store.auth.account
      const query = queryString.stringify({ identifier })
      const response = await fetch(`${ __membersApi__ }/businesses?${ query }`)

      if (response.ok) {
        const { businesses } = await response.json()
 
        // TODO: Handle edge case of no businesses,
        // if this is a possible case.

        if (businesses.length === 1) {
          automaticallyLinkedBusiness = businesses[0]
          store.business.link(automaticallyLinkedBusiness)
        }

        if (businesses.length > 1) {
          businessOptions = businesses
        }

        ready = true
      }

      else {
        // TODO: Handle an error response from the server.
        throw new Error()
      }
    }

    catch (error) {
      // TODO: Handle and test server unavailable.
      console.error(error)
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
    { #if automaticallyLinkedBusiness }
      <div class='card'>
        <h1>{ automaticallyLinkedBusiness.name } has been automatically linked</h1>
        <p>You can now charge customers as { automaticallyLinkedBusiness.name }.</p>
      </div>

      <a href='/scan' class='button-primary'>Scan QR Code</a>

    { :else if manuallyLinkedBusiness }
      <div class='card'>
        <h1>{ manuallyLinkedBusiness.name } successfully linked.</h1>
        <p>You can now charge customers as { manuallyLinkedBusiness.name }.</p>
      </div>

      <a href='/scan' class='button-primary'>Scan QR Code</a>

    { :else }
      <h1>Link Account</h1>
      <p>Select a business account to link to CG Pay on this device.</p>

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
</section>

<style lang='stylus'>
  #link-account
    background $white
    display flex
    flex-direction column
    height 100vh
    justify-content space-between
    padding $s2

    h1
      font-weight 600
      margin-bottom $s1

    .button-primary
      buttonPrimary()

    .card
      background $green
      border solid 1px $black
      padding $s2
      text-align center
</style>
