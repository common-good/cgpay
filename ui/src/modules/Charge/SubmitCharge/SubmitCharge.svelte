<script>
  import { createEventDispatcher } from 'svelte'
  import Profile from '#modules/Charge/Profile/Profile.svelte'
  import store from '#store.js'
  import { sendTxRequest, hash } from '#utils.js'
  // https://github.com/canutin/svelte-currency-input

  // --------------------------------------------

  export let otherAccount
  export let tx
  export let limit
 
  const dispatch = createEventDispatcher()

  // --------------------------------------------

  async function charge() {
    tx.created = Math.floor(Date.now() / 1000) // Unix timestamp
    tx.amount = (+tx.amount).toFixed(2)
    tx.proof = hash(tx.actorId + tx.amount + tx.otherId.split(/[.!]/)[0] + tx.created)
    tx.offline = false

    try {
      const res = await sendTxRequest(tx)
      if (res.ok) dispatch('complete'); else dispatch('er', res.message) // update display
    } catch (er) { // no matter what the error, queue it and treat it as success
        store.txs.queue(tx)
        if (!otherAccount.name) otherAccount.name = 'Unidentified Customer'
        dispatch('complete') // update display
    }
  }
</script>

<section id='submit-charge'>
  <h1>Charge</h1>
  <form on:submit|preventDefault={ charge }>
    <div class='charge-content'>
      <Profile { otherAccount } />

      <fieldset>
        <input id='charge-description' type='text' placeholder='Description' bind:value={ tx.description } required />
        <input id='charge-amount' type='number' min="0.01" step="0.01" max="{ limit }" placeholder='Amount' bind:value={ tx.amount } required />
      </fieldset>
    </div>

    <button type='submit'>Charge</button>
  </form>
</section>

<style lang='stylus'>
  section
    height 100%
    width 100%
    display flex
    flex-direction column
    justify-content space-between

  h1
    font-weight 600
    text-align center
    text lg
    margin-bottom $s2

  form
    height 100%
    display flex
    flex-direction column
    justify-content space-between

    input
      cgField()

    button
      cgButton()
      margin-bottom $s2

  .charge-content
    cgCard()
    background-color $c-green
</style>
