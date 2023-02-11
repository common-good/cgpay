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

<div class="select-account">
  <div class="top">
  <p>Select a Common Good account to link to CG Pay on this device.</p>
  <form>
    <label for='select-account' id='select-account'>Select Account:</label>
    <select name='select-account' size={size} bind:value={ selectedAccount }>
      { #each accountOptions as account }
        <option value={ account.id }>{ account.name }</option>
      { /each }
    </select>
  </form>
  </div>
  <button type="submit" on:click={ gotAccount }>Link Account</button>
</div>

<style lang='stylus'>
  button
    cgButton()

  form
    height 100%

  p
    margin-bottom $s2

  select
    border solid 1px

  option
    display flex
    align-items center
    padding $s-2
  
  .select-account
    height 80%
    display flex
    flex-direction column
    justify-content space-between

  .top
    padding 0 $s0
</style>
