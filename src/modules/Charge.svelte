<script>
  import store from '#store.js'
  import u from '#utils.js'
  import c from '#constants.js'
  import { onMount } from 'svelte'
  import { navigateTo } from 'svelte-router-spa'
  import queryString from 'query-string'
  import SubmitCharge from '#modules/SubmitCharge.svelte'
  import Modal from '#modules/Modal.svelte'; let m0, m1, m2

// import { encrypt, createMessage, readKey } from 'openpgp'
// Example with curl: curl -d "actorId=G6VM03&amount=1234.98&created=1672959981&description=test%20food&deviceId=GrfaVyHkxnTf4cxsyIEjkWyNdK0wUoDK153r2LIBoFocvw73T&offline=false&otherId=H6VM0G0NyCBBlUF1qWNZ2k&proof=d0e4eaeb4e9c1dc9d80bef9eeb3ad1342fd24997156cb57575479bd3ac19d00b" -X POST -H "Content-type: application/x-www-form-urlencoded" 'https://demo.commongood.earth/api/transactions'

  const dig36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const regionLens = '111111112222222233333333333344444444'
  const acctLens = '222233332222333322223333444444445555'
  const agentLens = '012301230123012301230123012301230123'
  const mainLens = '.12.13.22.23.32.33.34.44.45' // region and acct lens without agent
  
  let otherAccount = {
    agent: '',
    name: '',
    location: '',
  }
  
  let tx = {
    amount: null,
    description: $store.myAccount.selling ? $store.myAccount.selling[0] : null,
    deviceId: $store.myAccount.deviceId,
    actorId: noCardCode($store.myAccount.accountId),
    otherId: null,
    created: null,
    proof: null,
    offline: false,
  }
  
  const qr = $store.qr
  let tipable = false

  let gotTx = false
  let limit = null
  let photo = { alt: 'Customer Profile', blob: null }
  const pastAction = $store.selfServe ? 'Paid' : 'Charged'

  // --------------------------------------------

  function askUndo() { ({ m0, m1, m2 } = u.yesno('Reverse the transaction?', Undo, () => m0 = false)); m0=m0; m1=m1; m2=m2 }
  function showEr(msg0) {
    let msg = typeof msg0 == 'object' ? msg0.detail : msg0 // receive string or dispatch from SubmitCharge
    msg = msg; // this needs to be responsive
    ;({ m0, m1, m2 } = u.dlg('Alert', msg, 'OK', () => m0 = false)); m0=m0; m1=m1; m2=m2 
  }

  /**
   * Return the cardId with cardCode (and everything that follows) removed
   */
  function noCardCode(cardId) {
    if (cardId == null) return null
    const i = dig36.indexOf(cardId[0])
    const len = regionLens[i] + acctLens[i] + agentLens[i]
    return cardId.substr(0, len)
  }
  
  function handleSubmitCharge() { gotTx = true } // state success, show undo/tip/done/receipt buttons
    
  /**
   * Get the customer's photo from the server
   * @param query: query data for photoId endpoint
   */
  async function getPhoto(query) {
    const { result } = await u.timedFetch(`idPhoto?${ query }`, { type: 'blob' })
    return { alt: 'Customer Photo', blob: URL.createObjectURL(result) }
  }
  
  /**
   * Parse the given account identifier from a QR code.
   * Note that the cardCode part of the account identifier ranges from 9-15 chars (and may be extended to 20 someday)
   * @param qr: the QR code to parse
   * @return { acct, code, hash } where the accountId is separated into acct and code and hash is the cardCode hashed for storage
   */
  function qrParse(qr) {
    let acct, testing
    const parts = qr.split(/[\/.]/)

/*    if ((new RegExp('^[0-9A-Za-z]{12,29}[\.!]$')).test(qr)) { // like H6VM0G0NyCBBlUF1qWNZ2k.
      acct = parts[0]
      testing = qr.slice(-1) == '.'
    } else */
    if ((new RegExp('^HTTP://[0-9A-Za-z]{1,4}\.RC[24]\.ME/[0-9A-Za-z]{6,28}$')).test(qr)) { // like HTTP://6VM.RC4.ME/KDJJ34kjdfKJ4
      acct = parts[5][0] + parts[2] + parts[5].substring(1)
      testing = qr.includes('.RC4.')
    } else throw new Error('That is not a valid Common Good card format.')

    if (!testing && u.testMode()) throw new Error('That is a real Common Good card and cannot be used in test mode.')
    if (testing && !u.testMode()) throw new Error('That is a CGPay test card and cannot be used in production mode.')
// NO. This risks our data integrity    if (testing != u.testMode()) changeMode(testing)

    const agentLen = +agentLens[dig36.indexOf(acct[0])]
    const mainId = getMainId(acct)
    const acct0 = acct.substring(0, mainId.length + agentLen) // include agent chars in original account ID
    const code = acct.substring(acct0.length)
    return { acct: acct0, main: mainId, code: code, hash: u.hash(code) }
  }
  
  /**
   * Return just the region and acct parts of the QR.
   */
  function getMainId(acct) { 
    const i = dig36.indexOf(acct[0])
    const c1 = dig36[4 * mainLens.indexOf('.' + regionLens[i] + acctLens[i]) / 3] // format character without agent
    return c1 + acct.substring(1, 1 + +regionLens[i] + +acctLens[i])
  }

  function profileOffline() {
    showEr('OFFLINE. Trust this member or ask for ID.')
    limit = Math.min(c.offlineLimit, limit == null ? c.offlineLimit : limit)
  }
  
  /**
   * Undo the transaction.
   * To avoid timing issues with store.flushTxs(), queue the reversed transaction,
   * then delete both transactions at once.
   */
  async function Undo() {
    tx.amount = -tx.amount
    store.enqTx(tx)
    // NO! With flaky internet, this could queue the tx after unknowingly uploading it, then canceling the undo -- store.deleteTxPair()
    // Maybe see whether original tx was definitely taken offline, if this seems important
    u.goHome('The transaction has been reversed.')
  }

  onMount(async () => {
    try {
      if (qr == null) return navigateTo('/home') // pressed back button from Home page
      const card = qrParse(qr) // does not return if format is bad
      const mainId = getMainId($store.myAccount.accountId)
      if (card.main == mainId) throw new Error('That card is for the same account as yours.')
      const acctInfo = store.getAcct(card) // retrieve and/or update stored customer account info
      if (acctInfo) otherAccount = { ...otherAccount, ...acctInfo }
    
      tx.otherId = card.acct
      tx.code = card.code // store this temporarily, to create proof once we get the amount
      
      if (!$store.online) {
        profileOffline()
      } else  {
        const q = {deviceId: tx.deviceId, actorId: tx.actorId, otherId: tx.otherId + tx.code}
        const query = queryString.stringify(q)
        const { result } = await u.timedFetch(`identity?${ query }`)
        const { selling } = result
        if (selling.length) tx.description = selling[0]
        store.setMyAccount({ ...$store.myAccount, selling: selling })
        otherAccount = { ...otherAccount, ...result, lastTx:u.now() } // lastTx date lets us jettison old customers to save storage
        delete otherAccount.selling
        store.putAcct(card, otherAccount) // store and/or update stored customer account info
        store.setMyAccount({ ...$store.myAccount, lastTx: otherAccount.lastTx })
        limit = Math.min(otherAccount.limit, c.onlineLimit)
        if (!$store.selfServe) photo = await getPhoto(query)
      }
    } catch (er) {
      if (u.isTimeout(er)) { // internet unavailable; recognize a repeat customer or limit CG's liability
        profileOffline()
      } else if (isNaN(er.message)) {
        return u.goEr(er.message)
      } else if (er.message == '404') { // account not found
        return u.goEr('That is not a valid Common Good card.')
      } else {
        return u.goEr(u.crash(`An unexpected error occurred. Please alert Common Good's support team.`))
      }
    }
  })

</script>

<svelte:head>
  <title>CGPay - Charge Customer</title>
</svelte:head>

<section class="page" id="charge">
  { #if gotTx }
    <h1>Transaction Complete</h1>
    <div class='top'>
      <div class='charge-info'>
        <div class='row payee-info'>
          <p>{pastAction} to:</p>
          <div class='payee-details'>
          { #if $store.selfServe }
            <p>{ $store.myAccount.name }</p>
          { :else }
            {#if otherAccount.agent}
              <p>{ otherAccount.agent }</p>
              <p class='co'>{ otherAccount.name }</p>
            {:else}
              <p>{ otherAccount.name }</p>
            {/if}
          {/if}
          </div>
        </div>
        <div class='row'>
          <p>Description:</p>
          <p>{ tx.description }</p>
        </div>
        <div class='row'>
          <p>Amount:</p>
          <p>$ { tx.amount }</p>
        </div>
      </div>
      <div class="note">Thank you for using CGPay<br>for democracy and the common good!</div>
    </div>
    <div class="actions">
      { #if tipable }<a class="secondary" href='/tip'>Add Tip</a>{ /if }
      <!-- button>Receipt</button -->
      <button on:click={ askUndo } class="tertiary">Undo</button>
      <a class="primary" href='/home'>Done</a>
    </div>

  { :else }
    <SubmitCharge {otherAccount} {photo} {tx} {limit} on:error={showEr} on:complete={handleSubmitCharge} />
  { /if }
</section>

<Modal m0={m0} on:m1={m1} on:m2={m2} />

<style lang='stylus'>
  h1 
    margin-bottom $s1

  section
    height 100%
    width 100%
    display flex
    flex-direction column
    align-items center
    justify-content space-between

  .charge-info
    width 95%

  .note
    text(sm)
    text-align center
    border-top dashed 1px
    padding-top $s0

  .row
    display flex
    justify-content space-between
    align-items baseline
    width 100%
    p:first-of-type
      font-weight 600

  .payee-info
    margin-bottom $s2

  .payee-details
    text-align right
    p:first-of-type
      font-weight 400
    .co
      text sm
      
  .top
    height 100%
    width 100%
    display flex
    flex-direction column
    align-items center
    justify-content space-between
    margin-bottom $s1

  .actions
    display flex
    flex-direction column
    width 100%

    a, button
      margin-bottom $s1
    a:last-of-type
        margin-bottom 0

  .primary
    cgButton()

  .secondary
    cgButtonSecondary()

  .tertiary
    cgButtonTertiary()
  
</style>
