<script>
  import store from '#app.store.js'

  let account = $store.auth.account
  let business = $store.business.linked
  let confirm = false

  let transaction = {
    amount: null,
    description: null
  }

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
        confirm = true
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

<svelte:head>
  <title>CG Pay - Collect Payment</title>
</svelte:head>

<section id='charge'>
  { #if confirm }
    <h1>Success!</h1>

    <p>{ business.name } charged</p>

    <section id='confirmation'>
      <img id='customer-photo' src={ account.photo } alt='Customer Photo' />
      <p id='confirmation-customer-name'>{ account.name }</p>
      <p id='confirmation-customer-location'>{ account.location }</p>

      <p id='confirmation-charge-details'>
        <span>{ transaction.description }</span>
        <span>{ transaction.amount }</span>
      </p>
    </section>
  { :else }
    <h1>{ business.name }</h1>

    <img id='customer-photo' src={ account.photo } alt='Customer Photo' />
    <p id='customer-name'>{ account.name }</p>
    <p id='customer-location'>{ account.location }</p>

    <form on:submit|preventDefault={ charge }>
      <input id='charge-description' type='text' placeholder='Description' bind:value={ transaction.description } />
      <input id='charge-amount' type='number' placeholder='Amount' bind:value={ transaction.amount } />
      <button type='submit'>Charge</button>
    </form>
  { /if }
</section>
