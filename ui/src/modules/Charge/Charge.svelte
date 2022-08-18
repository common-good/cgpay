<script>
  import store from '#app.store.js'

  // --------------------------------------------

  let account = $store.auth.account
  let business = $store.business.linked
  let confirm = false

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
    <h2>{ business.name } charged</h2>

    <div class='charge-content' id='confirmation'>
      <img id='customer-photo' src={ account.photo } alt='Customer Photo' />
      <p id='confirmation-customer-name'>{ account.name }</p>
      <p id='confirmation-customer-location'>{ account.location }</p>

      <div id='confirmation-charge-details'>
        <p>{ transaction.description }</p>
        <p>{ transaction.amount }</p>
      </div>
    </div>
  { :else }
    <h1>{ business.name }</h1>

    <div class='charge-content'>
      <img id='customer-photo' src={ account.photo } alt='Customer Photo' />
      <p id='customer-name'>{ account.name }</p>
      <p id='customer-location'>{ account.location }</p>

      <form on:submit|preventDefault={ charge }>
        <input id='charge-description' type='text' placeholder='Description' bind:value={ transaction.description } />
        <input id='charge-amount' type='number' placeholder='Amount' bind:value={ transaction.amount } required />
        <button type='submit'>Charge</button>
      </form>
    </div>
  { /if }
</section>

<style lang='stylus'>
  #charge
    h1
      font-weight 600
      text-align center
      text lg
      margin 0 0 $s2

    h2
      font-weight 600
      text-align center
      margin 0 0 $s2

    .charge-content
      cgCard()
      background-color $c-green

    img
      clampSize(25vw, 150px)
      margin $s2 auto

    p
      text-align center

    #customer-name, #confirmation-customer-name
      text lg

    form
      margin $s2

      input
        cgField()

      button
        cgButton()

    #confirmation-charge-details
      margin $s2 0 0
      text lg
</style>
