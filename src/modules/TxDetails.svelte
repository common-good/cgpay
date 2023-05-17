<script>
  import st from'#store.js'
  import u from '#utils.js'
  import c from '#constants.js'
  import { onMount } from 'svelte'
  import SubmitCharge from '#modules/SubmitCharge.svelte'

// import { encrypt, createMessage, readKey } from 'openpgp'
// Example with curl: curl -d "actorId=G6VM03&amount=1234.98&created=1672959981&description=test%20food&deviceId=GrfaVyHkxnTf4cxsyIEjkWyNdK0wUoDK153r2LIBoFocvw73T&offline=false&otherId=H6VM0G0NyCBBlUF1qWNZ2k&proof=d0e4eaeb4e9c1dc9d80bef9eeb3ad1342fd24997156cb57575479bd3ac19d00b" -X POST -H "Content-type: application/x-www-form-urlencoded" 'https://demo.commongood.earth/api/transactions'
  
  const pay = $st.intent == 'pay'
  let otherAccount = {
    agent: '',
    name: '',
    location: '',
    limit: c.offlineLimit,
  }
  
  let tx = {
    amount: null,
    description: (!pay && $st.myAccount.selling) ? $st.myAccount.selling[0] : null,
    deviceId: $st.myAccount.deviceId,
    actorId: u.noCardCode($st.myAccount.accountId),
    otherId: null,
    created: null,
    proof: null,
    offline: false,
    version: c.version,
  }
  
  const qr = $st.qr
  let tipable = false
  let gotTx = false
  let photo = { alt: 'Customer Profile', blob: null }
  const pastAction = (pay || st.selfServe()) ? 'Paid' : 'Charged'

	u.undo.subscribe(askUndo) // receive notification of Back click (see Layout.svelte)

  function goHome() { u.go('home') }

  function askUndo() {
    if (!gotTx) return // Layout.svelte updates u.undo upon arrival. Ignore.
    st.setTimeout(null)
    u.yesno('Reverse the transaction?', 
      () => { u.hide(); st.undoTx(); u.goHome('The transaction has been reversed.') },
      () => { u.hide(); if (st.selfServe()) st.setTimeout(c.txTimeout)
    })
  }

  function handleSubmitCharge() {
    st.setTrail('', true) // no going back from here
    gotTx = true
    if (st.selfServe()) st.setTimeout(c.txTimeout)
  } // state success, show undo/tip/done/receipt buttons
    
  /**
   * Get the customer's photo from the server
   * @param info: data for photoId endpoint
   */
  async function getPhoto(info) {
    let blob = null
    if (!pay) {
      const res = await u.postRequest('idPhoto', info, { type:'blob' })
      blob = URL.createObjectURL(res)
    }
    return { alt:'photo of the other party', blob:blob }
  }

  function profileOffline() { if (!st.selfServe()) u.alert('OFFLINE. Trust this member or ask for ID.') }

  onMount(async () => {
    try {
      if (qr === null) return u.go('home') // pressed back button from Home page
      const card = u.qrParse(qr) // does not return if format is bad
      const mainId = u.getMainId($st.myAccount.accountId)
      if (card.main == mainId) throw new Error('That QR is for the same account as yours.')
      const acctInfo = st.getAcct(card) // retrieve and/or update stored customer account info
      if (acctInfo) otherAccount = { ...otherAccount, ...acctInfo }
    
      tx.otherId = card.acct
      tx.code = card.code // store this temporarily, to create proof once we get the amount
      
      if (!$st.online) {
        profileOffline()
      } else  {
        const info = {deviceId: tx.deviceId, actorId: tx.actorId, otherId: tx.otherId + tx.code}
        const res = await u.postRequest('identity', info)
        const { selling } = res
        if (selling.length) tx.description = selling[0]
        st.setMyAccount({ ...$st.myAccount, selling: selling })
        otherAccount = { ...otherAccount, ...res, lastTx:u.now() } // lastTx date lets us jettison old customers to save storage
        delete otherAccount.selling
        st.putAcct(card, otherAccount) // store and/or update stored customer account info
        if (otherAccount.limit <= 0) u.goEr('This account has no remaining funds, so a transaction is not possible at this time.')
        if (!st.selfServe()) photo = await getPhoto(info)
      }
    } catch (er) {
      if (u.isTimeout(er)) { // internet unavailable; recognize a repeat customer or limit CG's liability
        profileOffline()
      } else return u.goEr(u.qrEr(er)) // handle invalid QR and all other errors
    }
  })

</script>

<svelte:head>
  <title>CGPay - Transact</title>
</svelte:head>

<section class="page" id="tx-details">
  {#if gotTx}
    <h1 data-testid="transaction-complete">Transaction Complete</h1>
    <div class='top'>
      <div class='charge-info'>
        <div class='row payee-info'>
          <p><span data-testid="action">{pastAction}</span> to:</p>
          <div class='payee-details'>
          {#if st.selfServe()}
            <p data-testid="other-name">{ $st.myAccount.name }</p>
          {:else}
            {#if otherAccount.agent}
              <p data-testid="agent">{ otherAccount.agent }</p>
              <p class='co' data-testid="other-name">{ otherAccount.name }</p>
            {:else}
              <p data-testid="other-name">{ otherAccount.name }</p>
            {/if}
          {/if}
          </div>
        </div>
        <div class='row'>
          <p>Description:</p>
          <p data-testid="description">{ tx.description }</p>
        </div>
        <div class='row'>
          <p>Amount:</p>
          <p>$ <span data-testid="amount">{ u.withCommas(tx.amount) }</span></p>
        </div>
      </div>
      <div class="note" data-testid="thank-you">Thank you for using CGPay for democracy and the common good!</div>
    </div>
    <div class="actions">
      {#if tipable}<a class="secondary" href='/tip'>Add Tip</a>{/if}
      <!-- button>Receipt</button -->
      <button data-testid="btn-undo" on:click={askUndo} class="tertiary">Undo</button>
      <a class="primary" data-testid="btn-done" on:click={goHome}>Done</a>
    </div>

  { :else }
    <SubmitCharge {otherAccount} {photo} {tx} on:complete={handleSubmitCharge} />
  { /if }
</section>

<style lang='stylus'>
  h1 
    margin-bottom $s1

  section
    height calc(100vh + 300px)
    width 100%
    display flex
    flex-direction column
    align-items center
    justify-content space-between
    padding-bottom 400px

  .charge-info
    width 95%

  .note
    text(sm)
    text-align center
    border-top dashed 1px
    padding-top $s0
    width 95%

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
