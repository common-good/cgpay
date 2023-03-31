<script>
  import { createEventDispatcher } from 'svelte'

  export let accountOptions
  export let size

  const dispatch = createEventDispatcher()
  let selectedAccount
  let lock = true
  let selected

  function gotAccount() { dispatch('complete', { acct: selectedAccount, lock: lock } ) }

</script>

<div class="select-account">
  <div class="top">
  <p>Select a Common Good account to link to CGPay on this device.</p>
  <form>
    <select name='select-account' data-testid="select-account" size={size} on:click={ () => selected = true } bind:value={ selectedAccount } required="required">
      <option value='' disabled>Select an Account</option>
      { #each accountOptions as account }
        <option value={ account.id } data-testid={ 'option-' + account.id }>{ account.name }</option>
      { /each }
    </select>
    <label><input type="checkbox" data-testid="lock-account" name="lock-account" bind:checked={ lock } /> Require sign-in to change account</label>
  </form>
  </div>
  <button type="submit" data-testid="btn-link" on:click={ gotAccount } disabled={!selected}>Link Account</button>
</div>

<style lang='stylus'>
  button
    cgButton()

  form
    height 100%

  p
    margin-bottom $s2

  select
    border solid 1px $c-black
    margin-bottom $s2

  label
    text(md)
    display flex
    align-items center
    letter-spacing 0.005rem

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
