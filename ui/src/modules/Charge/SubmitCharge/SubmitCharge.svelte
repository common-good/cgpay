<script>
  import { createEventDispatcher } from 'svelte'
  import queryString from 'query-string'
  import Profile from '#modules/Charge/Profile/Profile.svelte'
  import store from '#app.store.js'
  import { sha256 } from 'js-sha256'
  // https://github.com/canutin/svelte-currency-input

  // --------------------------------------------

  export let other
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
  
  async function charge() {
    tx.created = Math.floor(Date.now() / 1000) // Unix timestamp
    tx.amount = (+tx.amount).toFixed(2)
    tx.proof = hash(tx.actorId + tx.amount + tx.otherId.split(/[.-]/) + tx.created)
    console.log(tx.actorId + tx.amount + tx.otherId.split(/[.-]/) + tx.created)
    if ($store.network.offline) return queueTx(tx);

    console.log(tx)
    try {
      const response = await fetch(`${ __membersApi__ }/transactions`, {
        method: 'POST',
        headers: {
//          'authorization': `Bearer ${ $store.myAccount.deviceId }`,
//          'Accept': 'application/json',
//          'Content-type': 'application/json',
          'Content-type': 'application/x-www-form-urlencoded',
        },
        mode: 'cors',
        cache: 'default',
//        body: JSON.stringify(tx)
        body: queryString.stringify(tx)
      })
      console.log(queryString.stringify(tx))
      console.log(response)
      if (response.ok) {
        dispatch('complete', tx)
      }

      else {
        errorMessage = `We couldn't complete the charge. Please try again.`
      }
    }

    catch (error) {
      // TODO: Handle and test no server access.
      console.error(error)
      errorMessage = 'We could not complete your request.'
    }
  }
</script>

<section id='submit-charge'>
  <form on:submit|preventDefault={ charge }>
    <div class='charge-content'>
      <Profile { other } />

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
