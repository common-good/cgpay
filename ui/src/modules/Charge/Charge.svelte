<script>
  import store from '#app.store.js'

  let account = $store.auth.account
  let business = $store.business.linked
</script>

<svelte:head>
  <title>CG Pay - Collect Payment</title>
</svelte:head>

<section id='charge'>
  <h1>{ business.name }</h1>

  <img id='customer-photo' src={ account.photo } alt='Customer Photo' />
  <p id='customer-name'>{ account.name }</p>
  <p id='customer-location'>{ account.location }</p>

  <form>
    <input type='text' placeholder='Description' />
    <input type='text' placeholder='Amount' />
  </form>
</section>
