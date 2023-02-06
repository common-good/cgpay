<script>
  import { createEventDispatcher } from 'svelte'

  // --------------------------------------------

  export let accountOptions
  export let size

  // --------------------------------------------

  const dispatch = createEventDispatcher()

  let selectedAccount

  // --------------------------------------------

  function gotAccount() {
    dispatch('complete', selectedAccount)
  }
</script>

<section id='select-account' class="select-account">
  <div class='link-account-content'>
    <h1>Link Account</h1>
    <p>Select a Common Good account to link to CGPay on this device.</p>

    <form>
      <label for='link-account-select-account'>Select Account:</label>

      <select id='link-account-select-account' size={ size } bind:value={ selectedAccount }>
        { #each accountOptions as account }
          <option value={ account.id }>{ account.name }</option>
        { /each }
      </select>
    </form>
  </div>

  <button class='link-account-action' on:click={ gotAccount }>Link Account</button>
</section>

<style lang='stylus'>
  @import '../LinkAccount.styl'

  .select-account
    height 100%
    display flex
    flex-direction column
    justify-content space-between
    
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
