<script>
  import { createEventDispatcher } from 'svelte'
  import Profile from '#modules/Profile.svelte'
  import st from'#store.js'
  import u from '#utils.js'
  // https://github.com/canutin/svelte-currency-input

  export let otherAccount
  export let photo
  export let tx
  export let limit

  const pay = $st.intent == 'pay'
  const action = (pay || st.selfServe()) ? 'Pay' : 'Charge'
  const dispatch = createEventDispatcher()

  async function charge() {
    if (!tx.proof) { // unless retrying
      tx.created = u.now() // Unix timestamp
      tx.amount = (pay ? -tx.amount : +tx.amount).toFixed(2)
      tx.proof = u.hash(tx.actorId + tx.amount + tx.otherId + tx.code + tx.created)
      delete tx.code
      tx.offline = false
    }
    st.setMyAccount({ ...$st.myAccount, lastTx:tx.created })

    try {
      const res = await u.postRequest('transactions', tx)
      if (res.ok) dispatch('complete'); else dispatch('error', res.message) // update display
    } catch (er) { // except for syntax errors, queue it and treat it as success
      if (er == 400) { // syntax error
        throw new Error('Program issue: request syntax error')
      } else {
        console.log('saving tx for upload later:',tx)
        st.enqTx(tx)                                                                                                         
        if (!otherAccount.name) otherAccount.name = 'Unidentified Member'
        dispatch('complete') // update display
      }
    }
  }
</script>

<section id="submit-charge">
  <h1 data-testid="action">{action}</h1>
  <form on:submit|preventDefault={ charge }>
    { #if !st.selfServe() }<Profile { otherAccount } {photo} />{ /if }
    <div class="bottom">
      <fieldset>
        <label for="amount">Amount</label>
        <input id="amount" data-testid="input-amount" type="number" min="0.01" step="0.01" max={ limit } name="amount" placeholder="$0.00" bind:value={ tx.amount } required />
        <label for="description">Description</label>
        <input id="description" data-testid="input-description" type="text" name="description" placeholder="e.g. lunch, rent, supplies, loan, etc." bind:value={ tx.description } autocomplete required />
      </fieldset>
      <button data-testid="btn-submit" type="submit">{action}</button>
    </div>
  </form>
</section>

<style lang="stylus">
  h1 
   margin-bottom $s0

  form
    height 100%
    display flex
    flex-direction column
    justify-content space-between

  section
    height 100%
    width 100%
    display flex
    flex-direction column
    align-items center
    justify-content space-between
    padding-bottom 800px

  button
    cgButton()
</style>
