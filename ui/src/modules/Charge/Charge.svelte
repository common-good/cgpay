<script>
  import store from '#store.js'
  import { goEr, goHome, timedFetch, CgError, filterObjByKey, isTimeout } from '#utils.js'
  import { onMount } from 'svelte'
  import queryString from 'query-string'
  import SubmitCharge from './SubmitCharge/SubmitCharge.svelte'
  import Modal from '../Modal.svelte'
  
//  import { encrypt, createMessage, readKey } from 'openpgp'

  // --------------------------------------------
  
  // Example with curl: curl -d "actorId=G6VM03&amount=1234.98&created=1672959981&description=test%20food&deviceId=GrfaVyHkxnTf4cxsyIEjkWyNdK0wUoDK153r2LIBoFocvw73T&offline=false&otherId=H6VM0G0NyCBBlUF1qWNZ2k&proof=d0e4eaeb4e9c1dc9d80bef9eeb3ad1342fd24997156cb57575479bd3ac19d00b" -X POST -H "Content-type: application/x-www-form-urlencoded" 'https://demo.commongood.earth/api/transactions'

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  const dig36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const regionLens = '111111112222222233333333333344444444'
  const acctLens = '222233332222333322223333444444445555'
  const agentLens = '012301230123012301230123012301230123'
  
  let otherAccount = {
    photoAlt: 'Retrieving Customer Profile...',
    agent: '',
    name: '',
    location: '',
  }
  
  let tx = {
    amount: 1.23, // DEBUG
    description: $store.myAccount.items ? $store.myAccount.items[0] : null,
    deviceId: $store.myAccount.deviceId,
    actorId: noCardCode($store.myAccount.accountId),
    otherId: null,
    created: null,
    proof: null,
    offline: false,
  }
  
  const onlineLimit = 10000
  const offlineLimit = 250
  let tipable = false

  let erMsg
  let myName
  let gotTx = false
  let limit = null
  let showConfirm = false

  // --------------------------------------------

  /**
   * Return the cardId with cardCode (and everything that follows) removed
   */
  function noCardCode(cardId) {
    const i = dig36.indexOf(cardId[0])
    const len = regionLens[i] + acctLens[i] + agentLens[i]
    return cardId.substr(0, len)
  }
  
  function handleSubmitCharge(ev) { // state success, show undo/tip/done buttons, set timer to return to home
    gotTx = true
  }

  async function getPhoto(query) {
    const { result } = await timedFetch(`idPhoto?${ query }`, { type: 'blob' })
    otherAccount.photoAlt = 'Customer Photo'
    otherAccount.photo = URL.createObjectURL(result)
  }
  
  /**
   * Parse the given account identifier, return {acct:, test:, count:} where acct is what to send to the server
   * Note that the cardCode part of the account identifier ranges from 9-15 chars (and may be extended to 20 someday)
   */
  function qrParse(qr) {
    const parts = qr.split(/[\/.]/)
    if ((new RegExp('^[0-9A-Za-z]{12,29}[\.!]$')).test(qr)) { // like H6VM0G0NyCBBlUF1qWNZ2k.
      return {acct: parts[0], test: qr.substring(-1) == '.'}
    }
    if ((new RegExp('^HTTP://[0-9A-Za-z]{1,4}\.RC[24]\.ME/[0-9A-Za-z]{11,28}$')).test(qr)) { // like HTTP://6VM.RC4.ME/KDJJ34kjdfKJ4
      return {acct: parts[5][0] + parts[2] + parts[5].substring(1), test: qr.includes('.RC4.')}
    }
    throw new CgError('That is not a valid Common Good card.')
  }
  
  /**
   * Return just the region and acct parts of the QR.
   * @todo: change the format character (acct[0]) to show agentLen = 0
   */
  function mainAcct(acct) { 
    const i = dig36.indexOf(acct[0])
    return acct.substring(0, 1 + regionLens[i] + acctLens[i] + agentLens[i])
  }

  function profileOffline() {
    erMsg = 'OFFLINE. Trust this member or ask for ID.'
    limit = Math.min(offlineLimit, limit == null ? offlineLimit : limit)
  }
  
  /**
   * Undo the transaction.
   * To avoid timing issues with store.txs.flush(), queue the reversed transaction,
   * then delete both transactions at once.
   */
  async function Undo() {
    tx.amount = -tx.amount
    store.txs.queue(tx)
    store.txs.undo(tx)
    goHome('The transaction has been reversed.')
  }

  onMount(async () => {
    try {
      const qr = store.qr.get()
      const card = qrParse(qr) // does not return if format is bad
      const acctInfo = store.accts.get(card) // retrieve and/or update stored customer account info
      if (acctInfo) otherAccount = { ...otherAccount, ...acctInfo }
      
      tx.otherId = card.acct
      myName = $store.myAccount.name
      
      if (!$store.network.online) {
        profileOffline()
      } else  {
        const q = {deviceId: $store.myAccount.deviceId, actorId: $store.myAccount.accountId, otherId: card.acct}
        const query = queryString.stringify(q)
        const res = await timedFetch(`identity?${ query }`)
        const result = res.result
        const { items } = result
        if (items.length) tx.description = items[0]
        await store.myAccount.set({ ...$store.myAccount, items })
        otherAccount = filterObjByKey({ ...otherAccount, ...result }, (key) => key != 'items' && !key.includes('photo'))
        limit = Math.min(otherAccount.limit, onlineLimit)
        await store.accts.put(card, otherAccount) // store and/or update stored customer account info
        getPhoto(query)
      }
    } catch (er) {
      if (isTimeout(er)) { // internet unavailable; recognize a repeat customer or limit CG's liability
        profileOffline()
      } else {
        goEr(er.message)
      }
    }
  })
</script>

<svelte:head>
  <title>CG Pay - Charge Customer</title>
</svelte:head>

<section id='charge'>
  { #if gotTx }
    <h2 class='action'>{ myName }</h2>
    <div class='charge-message'>
      <h1>Success!</h1>
      <p class='transaction-action'>You charged</p>
    </div>
    <div class='charge-content'>
      <p id='confirmation-customer-name'>{ otherAccount.name }</p>
    </div>

    <div id='charge-transaction-details'>
      <p>{ tx.amount }</p>
      <p>for { tx.description }</p>
    </div>

    { #if tipable }<a href='/tip'>Add Tip</a>{ /if }
    <!-- button>Receipt</button -->
    <button on:click={ () => showConfirm = true }>Undo</button>
    <a href='/home'>Done</a>

  { :else }
    <h2 class='action'>{ myName }</h2>
    <div class='charge-message'>
      <p class='transaction-action'>charge</p>
    </div>
    <SubmitCharge {otherAccount} {tx} {erMsg} {limit} on:complete={ handleSubmitCharge } />
  { /if }
</section>

<Modal show={showConfirm}
  title="Confirm"
  text="Reverse the transaction?"
  labels="Yes, No"
  on:fn1={Undo} on:fn2={ () => showConfirm = false }
/>

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

    a, button
      cgButton()
  
</style>
