<script>
  import { createEventDispatcher } from 'svelte'
  import queryString from 'query-string'
  import Profile from '#modules/Charge/Profile/Profile.svelte'
  import { navigateTo } from 'svelte-router-spa'
  import store from '#app.store.js'
  import { timedFetch, CgError } from '#utils.js'
  import { sha256 } from 'js-sha256'
  // https://github.com/canutin/svelte-currency-input

  // --------------------------------------------

  export let otherAccount
  export let tx

  // --------------------------------------------

  let errorMessage
  const dispatch = createEventDispatcher()

  // --------------------------------------------

  function hash(s) {
    const hash = sha256.create()
    hash.update(s)
    return hash.hex()
  }

  function queueTx(tx) {
    tx.offline = true
    store.txs.queue(tx)
    dispatch('complete', tx)
    return
  }
  
  async function sendTxRequest(tx) {
    const res = await timedFetch(`${ __membersApi__ }/transactions`, {
      method: 'POST',
      headers: { 'Content-type': 'application/x-www-form-urlencoded' },
      mode: 'cors',
      cache: 'default',
      body: queryString.stringify(tx)
    })
    console.log(queryString.stringify(tx))
    console.log(res)
//    if (!res.ok) throw new CgError(res.message)
  }
  
  async function charge() {
    tx.created = Math.floor(Date.now() / 1000) // Unix timestamp
    tx.amount = (+tx.amount).toFixed(2)
    tx.proof = hash(tx.actorId + tx.amount + tx.otherId.split(/[.!]/)[0] + tx.created)
    console.log(tx.actorId + tx.amount + tx.otherId.split(/[.!]/)[0] + tx.created)
    if ($store.network.offline) return queueTx(tx);

    console.log(tx)
    try {
      await sendTxRequest(tx)
      dispatch('complete', tx)
    } catch (er) {
      console.log(er);
      if (er.name == 'AbortError') { // internet unavailable; queue it and treat it like a success
        queueTx(tx)
      } else {
        store.errMsg.set(er.message)
//        navigateTo('/home') // this doesn't exist yet
        console.log(er);
      }
      // state success, show undo/tip/done buttons, set timer to return to home
    }
  }
</script>

<section id='submit-charge'>
  <form on:submit|preventDefault={ charge }>
    <div class='charge-content'>
      <Profile { otherAccount } />

      { #if errorMessage }
        <p>{ errorMessage }</p>
      { /if }

      <fieldset>
        <input id='charge-description' type='text' placeholder='Description' bind:value={ tx.description } />
        <input id='charge-amount' type='number' min="0.01" step="0.01" max="9999.99" placeholder='Amount' bind:value={ tx.amount } required />
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
