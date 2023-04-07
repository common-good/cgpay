// use this example for setv() and get(): https://svelte.dev/repl/ccbc94cb1b4c493a9cf8f117badaeb31?version=3.16.7

/**
 * Data structure
 *
 * The following data is stored, and cached in "cache" while the app runs.
 * 
 * SCALARS
 *   int sawAdd: Unix timestamp when user saw the option to save the app to their home screen
 *   blob qr: a scanned QR url
 *   string msg: an informational message to display on the Home Page
 *   string erMsg: an error message to display on the Home Page
 *   int cameraCount: number of cameras in the device
 *   bool frontCamera: true to use front camera instead of rear (default false iff mobile)
 *   bool online: true if the device is connected to the Internet
 *   bool useWifi: true to use wifi whenever possible (otherwise disable wifi)
 *   bool selfServe: true for selfServer mode
 * 
 * ARRAYS
 *    choices: a list (array) of Common Good accounts the signed-in user may choose to connect (one of) to the device
 *      accountId: the account ID including cardCode
 *      deviceId: a unique ID for the device associated with the account
 *      name: the name on the account
 *      qr: an image of the account’s QR code and ID photo (if any)
 *      isCo: true if the account is a company account
 *      selling: a list (array) of items for sale
 * 
 *    txs: transaction objects waiting to be uploaded to the server, each comprising:
 *      amount: dollars to transfer from actorId to otherId (signed)
 *      actorId: the account initiating the transaction
 *      otherId: the other participant in the transaction
 *      description: the transaction description
 *      created: Unix timestamp when the transaction was created
 *      proof: the proof of the transaction -- a SHA256 hash of actorId, amount, otherId (including cardCode), and created
 *        The amount has exactly two digits after the decimal point. For an Undo, proof contains the original amount.
 *      offline: true -- only transactions completed offline are in the txs queue (all Undos are handled offline)
 *      version: the app's integer version number
 * 
 *    comments: user-submitted comments to be uploaded to the server
 *      created: Unix timestamp
 *      actorId: the account making the comment
 *      text: the comment
 * 
 * OBJECTS
 *    corrupt: version number when a transaction or comment upload fails inexplicably
 *    accts: an array of accounts the device has transacted with, keyed by the account ID without cardCode, each with:
 *      hash: SHA256 hash of cardCode
 *      name: name of the account
 *      agent: agent for the account, if any
 *      location: location of the account (city, ST)
 *      limit: maximum amount this account can be charged at this time (leaving room for Stepups)
 *      creditLine: the account's credit line
 *      avgBalance: the account’s average balance over the past 6 months
 *      trustRatio: ratio of the account’s trust rating to the average trust rating of all individual accounts (zero for company accounts)
 *      since: Unix timestamp of when the account was activated
 * 
 *    myAccount: information about the account associated with the device
 *      accountId, deviceId, name, qr, isCo, and selling as in the choices array described above
 *      lastTx: Unixtime (in ms) of the last transaction known to this device (null if none)
 */
import { writable } from 'svelte/store'
import u from '#utils.js'
import c from '#constants.js'
import cache0 from '#cache.js'

export const createStore = () => {
  const lostMsg = `Tell the customer "I'm sorry, that card is marked "LOST or STOLEN".`

  let cache = { ...cache0, ...getst() }
  for (let k in cache) if (!(k in cache0)) delete cache[k]
  save(cache) // update store with any changes in defaults (crucial for tests)
  
  const { subscribe, update } = writable(cache)

  function getst() { return JSON.parse(localStorage.getItem(c.storeKey)) }
  function save(st) { localStorage.setItem(c.storeKey, JSON.stringify(st)); cache = st; return st }
  function setst(newSt) { update(st => { return save(newSt) } )}
  function setv(k, v) { update(st => { st[k] = v; return save(st) })}
  function enQ(k, v) { update(st => { st[k].push(v); return save(st) })}
  function deQ(k) { update(st => { st[k].shift(); return save(st) })} // this is actually FIFO (shift) not LIFO (pop)
  function del(k) { st0.update(st => { delete st[k]; return save(st) }) } // unused, but keep

  async function flushQ(k, endpoint) {
    if (cache.corrupt == c.version) return; else st.setCorrupt(null) // don't retry hopeless tx indefinitely
    while (cache[k].length > 0) {
      if (!cache.useWifi) return; // allow immediate interruptions when testing
      try {
        await u.postRequest(endpoint, cache[k][0])
      } catch (er) {
        if (u.isTimeout(er)) {
          await st.setOnline(false)
        } else {
          console.log('corrupt er:', er) // keep this
          console.log('corrupt cache', k, cache[k]) // keep this
          st.setCorrupt(c.version)
        }
        return // don't deQ when there's an error
      }
      deQ(k)
    }
  }

  // --------------------------------------------

  const st = {
//    subscribe,
    subscribe(func) { // extend the writable subscribe method to check messages from test framework first
      if (u.fromTester()) st.fromTester() // make sure we have the latest data before fulfilling a subscription
      return subscribe(func)
    },

    fromTester() { // called only in test mode (see Route.svelte, hooks.js, and t.tellApp)
      const fromTester = getst().fromTester
      setv('fromTester', {})
      if (!u.empty(fromTester)) {
        if (fromTester === 'restart') return st.clearData()
        for (let k of Object.keys(fromTester)) setv(k, fromTester[k])
      }
    },
    inspect() { return cache },

    setQr(v) { setv('qr', v) },
    setMsg(v) { setv('erMsg', v) },
    setCorrupt(version) { setv('corrupt', version) }, // pause uploading until a new version is released
    async setWifi(yesno) { setv('useWifi', yesno); await st.resetNetwork() },
    setSelfServe(yesno) { setv('selfServe', yesno) },

    setAcctChoices(v) { setv('choices', v) },
    setMyAccount(acct) { setv('myAccount', acct ? { ...acct } : null) },
    isSignedIn() { return (cache.myAccount != null) },
    signOut() { setv('myAccount', null) },
    clearData() { if (!u.realData()) setst({ ...cache0 }) },

    setSawAdd() { setv('sawAdd', u.now()) },
    setCameraCount(n) { setv('cameraCount', n) },
    setFrontCamera(yesno) { setv('frontCamera', yesno) },

    async resetNetwork() { if (cache.useWifi) await st.setOnline(navigator.onLine) },
    async setOnline(yesno) { // handling this in store helps with testing
      const v = cache.useWifi ? yesno : false
      if (v !== cache.online) setv('online', v)
      if (cache.useWifi && yesno) { await st.flushTxs(); await st.flushComments() }
    },

    /**
     * Store the given data about a customer account
     * @param {*} card: account identification parsed from QR
     * @param {*} acctData: information about a customer
     */
    putAcct(card, acctData) { update(st => {
      st.accts[card.acct] = { ...acctData, hash: card.hash } // only the hash of the security code gets stored
      return save(st)
    })},
    getAcct(card) {
      let acct = cache.accts[card.acct]
      if (acct == undefined) return null
      if (card.hash != acct.hash) return null // if later a new hash is validated, this entry will get updated
      if (acct.name == null) throw new Error(lostMsg) // if we encounter a hash collision for such a short string, it will be an important engineering discovery
      return acct
    },

    deleteTxPair() {
      update(st => {
        const q = [ ...st.txs ]
        const tx2 = q.pop()
        const tx1 = q.pop()
        if (tx1 && tx2 && tx2.created == tx1.created && tx2.amount == -tx1.amount) return save({ ...st, txs: q })
        return st
      })
    },

    enqTx(tx) {
      tx.offline = true
      enQ('txs', { ...tx })
    },
    async flushTxs() { await flushQ('txs', 'transactions') },
    deqTx() { return deQ('txs') }, // just for testing (in store.spec.js)

    comment(text) { enQ('comments', { deviceId:cache.myAccount.deviceId, actorId:cache.myAccount.accountId, created:u.now(), text:text }) },
    async flushComments() { await flushQ('comments', 'comments') },

  }

  return st
}

// --------------------------------------------

export default createStore()
