<script>
  import { createEventDispatcher } from 'svelte'

  import store from '#app.store.js'

  // --------------------------------------------

  export let businessOptions = []

  // --------------------------------------------

  const dispatch = createEventDispatcher()

  let selectedBusiness

  // --------------------------------------------

  function handleSelectBusiness() {
    store.business.link(selectedBusiness)
    dispatch('complete', selectedBusiness)
  }
</script>

<section id='select-business'>
  <div class='link-account-content'>
    <h1>Link Account</h1>
    <p>Select a business account to link to CG Pay on this device.</p>

    <form>
      <label for='link-account-select-business'>Select Account:</label>

      <select id='link-account-select-business' bind:value={ selectedBusiness }>
        { #each businessOptions as business }
          <option value={ business }>{ business.name }</option>
        { /each }
      </select>
    </form>
  </div>

  <button class='link-account-action' on:click={ handleSelectBusiness }>Link Account</button>
</section>

<style lang='stylus'>
  @import '../LinkAccount.styl'

  #select-business
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
        text-align left

      select
        border 1px solid $c-black
        cgField()

  .link-account-action
    linkAccountAction()

  .link-account-content
    linkAccountContent()
</style>
