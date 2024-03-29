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
    description: null,
    deviceId: $st.me.deviceId,
    actorId: u.noCardCode($st.me.accountId),
    otherId: null,
    created: null,
    proof: null,
    offline: false,
    version: c.version,
  }
  
  const qr = $st.qr
  let tipable = false
  let gotTx = false
  let card = null
  let photo = { alt: 'Customer Profile', blob: null } // used only for charges
  const pastAction = (pay || $st.selfServe) ? 'Paid' : 'Charged'

	u.undo.subscribe(askUndo) // receive notification of Back click (see Layout.svelte)

  function goHome() { u.go('home') }

  function askUndo() {
    if (!gotTx) return // Layout.svelte updates u.undo upon arrival. Ignore.
    st.setTimeout(null)
    u.yesno('Reverse the transaction?', 
      () => { u.hide(); st.undoTx(); u.goHome('The transaction has been reversed.') },
      () => { u.hide(); st.setTimeout(c.txTimeout)
    })
  }

  function handleSubmitCharge() {
    st.setTrail('', true) // no going back from here
    gotTx = true
    st.setTimeout(c.txTimeout)
  } // state success, show undo/tip/done/receipt buttons
    
  /**
   * Get the customer's photo from the server
   * @param info: data for photoId endpoint
   */
  async function getPhoto(info) {
    const res = await u.postRequest('idPhoto', info, { type:'blob' })
    photo.blob = URL.createObjectURL(res)
  }

  function profileOffline() { if (!$st.selfServe) u.alert('OFFLINE. Trust this member or ask for ID.') }

  onMount(async () => {
    if (qr === null) return u.go('home') // pressed back button from Home page
    if (u.lowStorage()) return u.goEr('You are running low on storage. Delete some media files or programs before trying again.')
    st.setCoPaying(false)
    try {
      card = u.qrParse(qr) // does not return if format is bad
      if (!pay && u.empty(card.code)) throw new Error('That QR is for payments only.')
      const mainId = u.getMainId($st.me.accountId)
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
        st.setMe({ ...$st.me, selling: res.isell })
        const dfts = res[pay ? 'selling' : 'isell']
        tx.description = dfts[0]
        otherAccount = { ...otherAccount, ...res, lastTx:u.now() } // lastTx date lets us jettison old customers to save storage
        delete otherAccount.isell
        st.putAcct(card, otherAccount) // store and/or update stored customer account info
        if (otherAccount.limit <= 0) u.goEr('This account has no remaining funds, so a transaction is not possible at this time.')
        if (!$st.selfServe && !pay) {
          await getPhoto(info)
        } else photo.blob = 'none'
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

{#if gotTx}
  <section class="page" id="tx-details">
    <h1 class="page-title" data-testid="tx-summary">Transaction Summary</h1>
    <div class='top'>
      <div class='charge-info'>
        <div class='row payee-info'>
          <p><span data-testid="action">{pastAction}</span> to:</p>
          <div class='payee-details'>
          {#if $st.selfServe}
            <p data-testid="other-name">{ $st.me.name }</p>
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
          <p>$ <span data-testid="amount">{ u.withCommas(Math.abs(tx.amount)) }</span></p>
        </div>
      </div>
      <div class="note" data-testid="thank-you">Thank you for using CGPay for democracy and the common good!</div>
    </div>
    {#if tipable}<a class="bottom secondary" href='/tip'>Add Tip</a>{/if}
    <!-- button>Receipt</button -->
    <button class="bottom tertiary" data-testid="btn-undo" on:click={askUndo}>Undo</button>
    <a class="bottom primary" data-testid="btn-done" on:click={goHome}>Done</a>
  </section>
{ :else }
  <SubmitCharge {otherAccount} {photo} {tx} on:complete={handleSubmitCharge} />
{ /if }

<style lang='stylus'>
  h1 
    margin-bottom $s1

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
