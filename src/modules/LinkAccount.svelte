<script>
  import { onMount } from 'svelte'
  import st from'#store.js'
  import u from '#utils.js'
  import c from '#constants.js'
  import SelectX from '#modules/SelectX.svelte'
  import Radios from '#modules/Radios.svelte'

  // --------------------------------------------

  let acctOpts = []
  let size = 4 // number of choices to show without scrolling (fails on Android)
  let lock = true
  let selfServe = false // used only if c.showSelfServe and not c.showScanToPay
  let myAccount
  let ready = false
  let acctIndex = null
  let payOk = c.showScanToPay ? 'scan' : 'never'
  const choices = $st.choices
  const payOkOptions = { always:'always', scan:'only if a manager scans in', never:'never', self:'self-serve mode' }
  if (!c.showSelfServe) delete payOkOptions.self
  
  function er(msg) { u.alert(msg) } 
  function signOut() { st.signOut(); u.go('') }

  function gotAccount() {
    myAccount = choices && choices[acctIndex]
    st.setMyAccount(myAccount)
    if (lock) st.setAcctChoices(null)
    st.setPayOk(myAccount.isCo ? payOk : null)
    if (selfServe) st.setPayOk('self') // only if c.showSelfServe and not c.showScanToPay
    u.goHome(`This device is now linked to your Common Good account: ${myAccount?.name}.`)
  }

  onMount(async () => {
    st.setLeft('logo')
    st.setMyAccount(null) // clear account preferences
    ready = true
    if (choices?.length) {
      for (let i in choices) acctOpts[i] = choices[i].name
      size = Math.min(size, acctOpts.length)
      acctIndex = Math.min(size, 1) // default to first managed account, if any, else individual's own
    } else {
      er('Your account is not yet active. Sign in at CommonGood.earth to finish opening your account.')
    }
  })
</script>

<svelte:head>
  <title>CGPay - Link Account</title>
</svelte:head>

<!-- <Navigation /> -->
<section class="card" id="link-account">
  <h1>Link Account</h1>
  {#if ready}
    <div class="select-account">
      <div class="top">
        <p>Select a Common Good account to link to CGPay on this device.</p>
        <form>
          <SelectX name="account" label={'Select an account'} options={acctOpts} size={size} bind:value={acctIndex} required="required" />
          {#if acctIndex > 0 && c.showScanToPay}
            <p>Allow payments from this account:</p>
            <Radios name="payOk" options={payOkOptions} bind:value={payOk} required="required" />
          {/if}
          {#if size > 0}
            <label><input type="checkbox" data-testid="lock-account" name="lock-account" 
              bind:checked={lock} class={ lock ? 'checked' : '' }/> Require sign-in to change account</label>
          {/if}
          {#if c.showSelfServe && !c.showScanToPay && acctIndex > 0}
            <label><input type="checkbox" data-testid="self-serve" name="self-serve" 
              bind:checked={selfServe} class={ selfServe ? 'checked' : '' }/> Self-serve mode</label>
          {/if}
        </form>
      </div>
      <button class="tertiary" on:click={signOut}>Sign Out</button>
      <button class="primary" type="submit" data-testid="btn-link" on:click={gotAccount} disabled={ acctIndex === null }>Link Account</button>
    </div>
  {:else}
    <div class="loading">
      <p>Loading your accounts...</p>
    </div>
  {/if}
</section>

<style lang='stylus'>
  .loading
    height 100%
    display flex
    align-items center
    font-style italic
    margin-bottom $s5

  h1
    text xl
    margin-bottom $s1

  p
    margin-bottom $s1

  label
    text(md)
    display flex
    align-items center
    letter-spacing 0.005rem
    margin-bottom 1rem

  .card
    height 100%
    display flex
    flex-direction column
    align-items center
    background $c-white
    box-shadow: 2px 2px 4px $c-gray-dark
    border-radius: 2%
    padding $s5 $s-2 $s-2

  .form-lower 
    margin-top $s2

  .select-account
    display flex
    flex-direction column
    justify-content space-between
    height 100%

  .tertiary
    margin-bottom $s-1

  .top
    padding 0 $s0
</style>
