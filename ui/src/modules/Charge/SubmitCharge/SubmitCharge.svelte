<script>
  import { createEventDispatcher } from 'svelte'

  import Profile from '#modules/Charge/Profile/Profile.svelte'
  import store from '#app.store.js'
  // https://github.com/canutin/svelte-currency-input

  // --------------------------------------------

  export let other
  export let transaction

  // --------------------------------------------

  const dispatch = createEventDispatcher()

  let errorMessage


  // --------------------------------------------

  async function charge() {
    if ($store.network.offline) {
      store.transactions.queue(transaction)
      dispatch('complete', transaction)
      return
    }

    try {
      const response = await fetch(`${ __membersApi__ }/transaction`, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${ $store.auth.token }`,
          'content-type': 'application/json'
        },
        body: JSON.stringify(transaction)
      })

      if (response.ok) {
        dispatch('complete', transaction)
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
        <input id='charge-description' type='text' placeholder='Description' bind:value={ transaction.description } />
        <input id='charge-amount' type='number' min="0.01" step="0.01" max="9999.99" placeholder='Amount' bind:value={ transaction.amount } required />
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
