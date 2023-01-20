<script>
  import { createEventDispatcher } from 'svelte'
  import Profile from '#modules/Charge/Profile/Profile.svelte'
  import store from '#store.js'
  import { isTimeout, sendTxRequest, goEr } from '#utils.js'
  import { sha256 } from 'js-sha256'
  // https://github.com/canutin/svelte-currency-input

  // --------------------------------------------

  export let otherAccount
  export let tx
  export let errorMessage
  export let limit
  
  // --------------------------------------------

  const dispatch = createEventDispatcher()

  // --------------------------------------------

  function hash(s) {
    const hash = sha256.create()
    hash.update(s)
    return hash.hex()
  }

  async function charge() {
    tx.created = Math.floor(Date.now() / 1000) // Unix timestamp
    tx.amount = (+tx.amount).toFixed(2)
    tx.proof = hash(tx.actorId + tx.amount + tx.otherId.split(/[.!]/)[0] + tx.created)
    tx.offline = false
    console.log(tx.actorId + tx.amount + tx.otherId.split(/[.!]/)[0] + tx.created)
    console.log(tx)

    try {
      const res = await sendTxRequest(tx)
      console.log(res)
      if (res.ok) dispatch('complete'); else errorMessage = res.message // update display
    } catch (er) {
      if (isTimeout(er)) { // internet unavailable; queue it and treat it like a success
        console.log('timeout er')
        console.log(er)
        store.txs.queue(tx)
        if (!otherAccount.name) otherAccount.name = 'Unidentified Customer'
        errorMessage = 'OFFLINE'
        dispatch('complete') // update display
      } else {
        goEr(er.message)
      }
    }
  }
</script>

<section id='submit-charge'>
  <form on:submit|preventDefault={ charge }>
    <div class='charge-content'>
      <Profile { otherAccount } />

      { #if errorMessage }<p>{ errorMessage }</p>{ /if }

      <fieldset>
        <input id='charge-description' type='text' placeholder='Description' bind:value={ tx.description } />
        <input id='charge-amount' type='number' min="0.01" step="0.01" max="{ limit }" placeholder='Amount' bind:value={ tx.amount } required />
      </fieldset>
    </div>

    <button type='submit'>Charge</button>
  </form>
</section>

<style lang='stylus'>
  form
    fieldset
      margin $s2 0 0

    input
      cgField()

    button
      cgButton()
      margin $s2 0 0

  .charge-content
    cgCard()
    background-color $c-green
</style>
