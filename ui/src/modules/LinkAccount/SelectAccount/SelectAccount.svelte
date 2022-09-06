<script>
  import { createEventDispatcher } from 'svelte'

  import store from '#app.store.js'

  // --------------------------------------------

  export let options = []

  // --------------------------------------------

  const dispatch = createEventDispatcher()

  let selectedAccount

  // --------------------------------------------

  function handleSelectAccount() {
    store.accounts.link(selectedAccount)
    dispatch('complete', selectedAccount)
  }
</script>

<section id='select-account'>
  <div class='link-account-content'>
    <h1>Link Account</h1>
    <p>Select an account to link to CG Pay on this device.</p>

    <form>
      <label for='link-account-select-account'>Select Account:</label>

      <select id='link-account-select-account' bind:value={ selectedAccount }>
        { #each options as account }
          <option value={ account }>{ account.name }</option>
        { /each }
      </select>
    </form>
  </div>

  <button class='link-account-action' on:click={ handleSelectAccount }>Link Account</button>
</section>

<style lang='stylus'>
  @import '../LinkAccount.styl'

  #select-account
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
