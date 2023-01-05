<script>
  import store from '#app.store.js'
  import { onMount } from 'svelte'
  import queryString from 'query-string'
  import Profile from './Profile/Profile.svelte'
  import SubmitCharge from './SubmitCharge/SubmitCharge.svelte'
//  import { encrypt, createMessage, readKey } from 'openpgp'

  // --------------------------------------------

  let other = {
    photoAlt: 'Retrieving Customer Account...',
    agent: 'agt',
    name: 'nm',
    location: 'loc',
  }
  let transaction = {
    amount: null,
    description: null
  }
  let errorMessage
  let myName
  let gotTx = false

  // --------------------------------------------

  function handleSubmitCharge(event) {
    transaction = event.detail
    gotTx = true
  }
  /*
  async function cgEncrypt(text) {
  console.log('before readKey');
    const publicKey = await readKey({ armoredKey: cgPublicKey });
    console.log('after readKey');
    const crypt = await encrypt({
      message: await createMessage({ text: text }), // input as Message object
      encryptionKeys: publicKey,
    });

    return crypt
  }
  */
  async function getPhoto(query) {
  
/*    const deviceId = $store.myAccount.deviceId;
    const crypt = await cgEncrypt(deviceId.substr(0, 50) + qr)
    const code = btoa(crypt).replace('+', '-').replace('_', '/')
    q = {deviceId: deviceId, accountId: qr.substr(0, 6), code: code}
    console.log(q)
    const query = queryString.stringify(q)
    */
    
    console.log('before idPhoto')
    const res = await fetch(`${ __membersApi__ }/idPhoto?${ query }`)
    if (res.ok) {
      other.photoAlt = 'Customer Photo'
      const blob = await res.blob()
      other.photo = URL.createObjectURL(blob)
    } else {
      errorMessage = `We couldn't find an account with that information. Please try again.`
    }
  }
  
  onMount(async () => {
    errorMessage = 'Finding your account(s)...'
    try {
      const qr = store.qr.get();
      myName = $store.myAccount.name
      console.log(myName);
      const q = {deviceId: $store.myAccount.deviceId, otherId: qr}
      const query = queryString.stringify(q)
      console.log(q)
      fetch(`${ __membersApi__ }/identity?${ query }`)
      .then(async (res) => {
        console.log(res)
        if (res.ok) {
          const obj = await res.json()
          other = {...other, ...obj}
          const firstItem = { ...$store.myAccount.items }[0]
          if (firstItem) transaction.description = firstItem
        } else {
          errorMessage = `We couldn't find an account with that information. Please try again.`
        }
      })
      .then(getPhoto(query))

    } catch (error) {
      console.log(error);
      errorMessage = `The server is unavailable. Check your internet connection and try again?`
    }
  })
</script>

<svelte:head>
  <title>CG Pay - Charge Customer</title>
</svelte:head>

<section id='charge'>
  <div class='charge-message'>
    { #if gotTx }
      <h1>Success!</h1>
      <h2 class='action'>{ myName }</h2><p class='transaction-action'>charged</p>
    { :else }
      <h2 class='action'>{ 'as ' + myName }</h2><p class='transaction-action'>charge</p>
    { /if }
  </div>

  { #if gotTx }
    <div class='charge-content'>
      <Profile { other } />
    </div>

    <div id='charge-transaction-details'>
      { #if transaction.description }
        <p>{ transaction.description }</p>
      { /if }

      <p>{ transaction.amount }</p>
    </div>

    <a href='/scan'>Scan Again</a>

  { :else }
    <SubmitCharge { other }, { transaction } on:complete={ handleSubmitCharge } />
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
      
    h2.action
      margin 0

    .charge-content
      cgCard()
      background-color $c-green
      
    .transaction-action
      margin 0 0 $s2
      text-align center

    #charge-transaction-details
      margin $s2 0
      text lg
      text-align center

    a
      cgButton()
</style>
