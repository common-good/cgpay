<script>
  import queryString from 'query-string'
  import { onMount } from 'svelte'
  import st from'#store.js'
  import u from '#utils.js'
  import c from '#constants.js'
  import SelectX from '#modules/SelectX.svelte'
  import Radios from '#modules/Radios.svelte'
  import Modal from '#modules/Modal.svelte'; let m0, m1, m2

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
  
  function er(msg) { ({ m0, m1 } = u.dlg('Alert', msg, 'Close', () => m0 = false)); m0=m0; m1=m1 } 

  function gotAccount() {
    myAccount = choices && choices[acctIndex]
    st.setMyAccount(myAccount)
    if (lock) st.setAcctChoices(null)
    st.setPayOk(myAccount.isCo ? payOk : null)
    if (selfServe) st.setPayOk('self') // only if c.showSelfServe and not c.showScanToPay
    u.goHome(`This device is now linked to your Common Good account: ${myAccount?.name}.`)
  }

  onMount(async () => {
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

<section class="page" id="link-account">
  <h1>Link Account</h1>
  {#if ready}
    <div class="select-account">
      <div class="top">
        <p>Select a Common Good account to link to CGPay on this device:</p>
        <form>
          <SelectX name="account" options={acctOpts} size={size} bind:value={acctIndex} required="required" />
          {#if acctIndex > 0 && c.showScanToPay}
            <p>Allow payments from this account:</p>
            <Radios name="payOk" options={payOkOptions} bind:value={payOk} required="required" />
          {/if}
          {#if size > 0}
            <label><input type="checkbox" data-testid="lock-account" name="lock-account" 
              bind:checked={lock} class={ lock ? 'checked' : '' }/> Require sign-in to change account</label>
          {/if}
          {#if c.showSelfServe && !c.showScanToPay}
            <label><input type="checkbox" data-testid="self-serve" name="self-serve" 
              bind:checked={selfServe} class={ selfServe ? 'checked' : '' }/> Self-serve mode</label>
          {/if}
        </form>
      </div>
      <button type="submit" data-testid="btn-link" on:click={gotAccount} disabled={ acctIndex === null }>Link Account</button>
    </div>
  {:else}
    <div class="loading">
      <p>Loading your accounts...</p>
    </div>
  {/if}
</section>

<Modal m0={m0} on:m1={m1} on:m2={m2} />

<style lang='stylus'>
  section
    display flex
    flex-direction column
    align-items center
    width 100%
    height 100%

  .loading
    height 100%
    display flex
    align-items center
    font-style italic
    margin-bottom $s5

  button
    cgButton()

  h1 
    margin-bottom $s1

  p
    margin-bottom 0.5rem

  label
    text(md)
    display flex
    align-items center
    letter-spacing 0.005rem
    margin-bottom 1rem

  .top
    padding 0 $s0
</style>
