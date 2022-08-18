<script>
  import { createEventDispatcher } from 'svelte'

  import Profile from '#modules/Charge/Profile/Profile.svelte'
  import store from '#app.store.js'

  // --------------------------------------------

  export let account

  // --------------------------------------------

  const dispatch = createEventDispatcher()

  let errorMessage

  let transaction = {
    amount: null,
    description: null
  }

  // --------------------------------------------

  async function charge() {
    try {
      const response = await fetch(`${ __membersApi__ }/charges`, {
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
      <Profile { account } />

      { #if errorMessage }
        <p>{ errorMessage }</p>
      { /if }

      <fieldset>
        <input id='charge-description' type='text' placeholder='Description' bind:value={ transaction.description } />
        <input id='charge-amount' type='number' placeholder='Amount' bind:value={ transaction.amount } required />
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
