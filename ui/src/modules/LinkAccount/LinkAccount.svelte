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
    { #if automaticallyLinkedBusiness }
      <div class='link-account-status'>
        <h1>{ automaticallyLinkedBusiness.name } automatically linked.</h1>
        <p>You can now charge customers as { automaticallyLinkedBusiness.name }.</p>
      </div>

      <a href='/scan'>Scan QR Code</a>

    { :else if manuallyLinkedBusiness }
      <div class='link-account-status'>
        <h1>{ manuallyLinkedBusiness.name } successfully linked.</h1>
        <p>You can now charge customers as { manuallyLinkedBusiness.name }.</p>
      </div>

      <a href='/scan'>Scan QR Code</a>

    { :else }
      <div id='link-account-multiple' class='link-account-status'>
        <h1>Link Account</h1>
        <p>Select a business account to link to CG Pay on this device.</p>

        <form>
          <label for='select-business'>Select Account:</label>

          <select id='select-business' bind:value={ selectedBusiness }>
            { #each businessOptions as business }
              <option value={ business }>{ business.name }</option>
            { /each }
          </select>
        </form>
      </div>

      <button on:click={ selectBusiness }>Link Account</button>
    { /if }
  { /if }
</section>

<style lang='stylus'>
  #link-account
    display flex
    flex-direction column
    justify-content space-between
    width 100%

    .link-account-status
      background $c-green
      border 1px solid $c-black
      padding $s2

      h1
        font-weight 600
        margin-bottom $s1
        text lg
        text-align center

      p
        text-align center

    a, button
      cgButton()
      margin $s2 0

    #link-account-multiple
      p
        contentNarrow(300px)
        margin $s2 auto
        text-align left

      form
        contentNarrow(300px)

        label
          display block
          font-weight 600
          margin-bottom $s1
          text sm

        select
          cgField()

          border 1px solid $c-black
</style>
