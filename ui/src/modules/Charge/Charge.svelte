<script>
  import store from '#app.store.js'
  import { onMount } from 'svelte'
  import queryString from 'query-string'
  import Profile from './Profile/Profile.svelte'
  import SubmitCharge from './SubmitCharge/SubmitCharge.svelte'
//  import { encrypt, createMessage, readKey } from 'openpgp'

  // --------------------------------------------
  
  // Example with curl: curl -d "actorId=G6VM03&amount=1234.98&created=1672959981&description=test%20food&deviceId=GrfaVyHkxnTf4cxsyIEjkWyNdK0wUoDK153r2LIBoFocvw73T&offline=false&otherId=H6VM0G0NyCBBlUF1qWNZ2k&proof=d0e4eaeb4e9c1dc9d80bef9eeb3ad1342fd24997156cb57575479bd3ac19d00b" -X POST -H "Content-type: application/x-www-form-urlencoded" 'https://demo.commongood.earth/api/transactions'

  const otherId = store.qr.get()

  const fmts = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const regionLens = '111111112222222233333333333344444444'
  const acctLens = '222233332222333322223333444444445555'
  const agentLens = '012301230123012301230123012301230123'
  
  let other = {
    photoAlt: 'Retrieving Customer Profile...',
    agent: '',
    name: '',
    location: '',
  }
  
  let tx = {
    amount: null,
    description: null,
    deviceId: $store.myAccount.deviceId,
    actorId: noCardCode($store.myAccount.accountId),
    otherId: otherId,
    created: null,
    proof: null,
    offline: false,
  }
  
  let errorMessage
  let myName
  let gotTx = false

  // --------------------------------------------

  /**
   * Return the cardId with cardCode (and everything that follows) removed
   */
  function noCardCode(cardId) {
    const i = fmts.indexOf(cardId[0])
    const len = regionLens[i] + acctLens[i] + agentLens[i]
    return cardId.substr(0, len)
  }
  
  function handleSubmitCharge(event) {
    tx = {...tx, ...event.detail}
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
    const crypt = await cgEncrypt(deviceId.substr(0, 50) + otherId)
    const code = btoa(crypt).replace('+', '-').replace('_', '/')
    q = {deviceId: deviceId, accountId: otherId.substr(0, 6), code: code}
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
    errorMessage = 'Finding the customer account...'
    try {
      myName = $store.myAccount.name
      console.log(myName);
      const q = {deviceId: $store.myAccount.deviceId, otherId: otherId}
      const query = queryString.stringify(q)
      console.log(q)
      fetch(`${ __membersApi__ }/identity?${ query }`)
      .then(async (res) => {
        console.log(res)
        if (res.ok) {
          const obj = await res.json()
          other = {...other, ...obj}
          const firstItem = { ...$store.myAccount.items }[0]
          if (firstItem) tx.description = firstItem
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
      <p id='confirmation-customer-name'>{ other.name }</p>
    </div>

    <div id='charge-transaction-details'>
      <p>{ tx.amount }</p>
      <p>for { tx.description }</p>
    </div>

    <a href='/scan'>Scan Another QR</a>

  { :else }
    <SubmitCharge { other }, { tx } on:complete={ handleSubmitCharge } />
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
