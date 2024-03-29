<script>
  import { createEventDispatcher } from 'svelte'
  import Profile from '#modules/Profile.svelte'
  import st from'#store.js'
  import u from '#utils.js'
  import c from '#constants.js'
  // https://github.com/canutin/svelte-currency-input

  export let otherAccount
  export let photo
  export let tx

  const pay = $st.intent == 'pay'
  const action = (pay || $st.selfServe) ? 'Pay' : 'Charge'
  const dispatch = createEventDispatcher()

  function validateAmount() {
    const old = tx.amount
    tx.amount = +tx.amount.toFixed(2) // round to 2 decimals
    if (tx.amount != old) return u.alert('The amount has been rounded to two decimal places. Make sure this is what you intended and try again.')
    if (tx.amount > c.onlineLimit) return u.alert(`CGPay transactions are limited to $${u.withCommas(c.onlineLimit)}`)
    if (tx.amount > otherAccount.limit) return u.alert(`This transaction is limited to $${u.withCommas(otherAccount.limit)}.`)
    if (tx.amount <= 0 ) return u.alert('The amount must be greater than zero.')
    return true
  }

  async function charge() {
    if (!validateAmount(tx.amount)) return

    if (!tx.proof) { // unless retrying
      tx.created = u.now() // Unix timestamp
      tx.amount = (pay ? -tx.amount : +tx.amount).toFixed(2) // convert to string
      const proof0 = tx.actorId + tx.amount + tx.otherId + tx.code + tx.created
      //console.log('proof0', proof0)
      tx.proof = u.hash(proof0)
      delete tx.code
      tx.offline = false
      tx.pending = !(pay || $st.me.isCo || $st.selfServe) // individuals cannot unilaterally charge others
    }
    st.setPending(true) // give the user a chance to undo (or add a tip)
    if (!otherAccount.name) otherAccount.name = 'Unidentified Member'
    st.enqTx(tx)
    st.setRecentTxs({ ...tx, name:otherAccount.name }) // assume, for now, the tx will succeed
    if (!tx.pending) st.setBalance(+$st.balance + +tx.amount)
    dispatch('complete') // update display
  }
</script>

<section class="page" id="submit-charge">
  <h1 class="page-title" data-testid="action">{action}</h1>
  <form on:submit|preventDefault={charge}>
    { #if !$st.selfServe }<Profile {otherAccount} {photo} />{ /if }
    <label for="amount">Amount</label>
    <input id="amount" data-testid="input-amount" type="number" step="any" name="amount" placeholder="$0.00" bind:value={tx.amount} required />
    <label for="description">Description</label>
    <input id="description" data-testid="input-description" type="text" name="description" placeholder="e.g. lunch, rent, supplies, loan, etc." bind:value={ tx.description } autocomplete required />
    <button data-testid="btn-submit" type="submit">{action}</button>
  </form>
</section>

<style lang="stylus">
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

  label
    flex 0 0 10px
    width 100%

  input
    flex 0 0 60px
    width 100%

  button
    cgButton()
</style>
