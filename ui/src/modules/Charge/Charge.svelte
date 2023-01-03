<script>
  import store from '#app.store.js'

  import Profile from './Profile/Profile.svelte'
  import SubmitCharge from './SubmitCharge/SubmitCharge.svelte'

  // --------------------------------------------

  let myAccount = store.myAccount
  let account = 'customer name'
  let transaction

  // --------------------------------------------

  function handleSubmitCharge(event) {
    transaction = event.detail
  }
</script>

<svelte:head>
  <title>CG Pay - Collect Payment</title>
</svelte:head>

<section id='charge'>
  <div class='charge-message'>
    { #if transaction }
      <h1>Success!</h1>
      <h2>{ myAccount.name } charged</h2>
    { :else }
      <h1>{ myAccount.name }</h1>
    { /if }
  </div>

  { #if transaction }
    <div class='charge-content'>
      <Profile { account } />
    </div>

    <div id='charge-transaction-details'>
      { #if transaction.description }
        <p>{ transaction.description }</p>
      { /if }

      <p>{ transaction.amount }</p>
    </div>

    <a href='/scan'>Scan Again</a>

  { :else }
    <SubmitCharge { account } on:complete={ handleSubmitCharge } />
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

    #charge-transaction-details
      margin $s2 0
      text lg
      text-align center

    a
      cgButton()
</style>
