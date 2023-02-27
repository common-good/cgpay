import { get, writable } from 'svelte/store'
import { sendRequest, isTimeout } from '#utils.js'

// --------------------------------------------
// use this example for set() and get(): https://svelte.dev/repl/ccbc94cb1b4c493a9cf8f117badaeb31?version=3.16.7

/**
 * Data structure
 *
 * SPACES
 *   testMode: contains just a boolean value - true if the app is in test mode
 *   real: contains a JSON object of all the app's stored data for production mode
 *   test: contains a JSON object of all the app's stored data for test mode
 * 
 * In the "real" and "test" spaces the following data is stored, and cached in "cache" while the app runs.
 * 
 * SCALARS
 *   int sawAdd: Unix timestamp when user saw the option to save the app to their home screen
 *   blob qr: a scanned QR url
 *   string msg: an informational message to display on the Home Page
 *   string erMsg: an error message to display on the Home Page
 *   string corrupt: a string (possibly a JSON object stringified) of corrupt data to report to the Tech Team
 *   bool testing: true when the app is in test mode (cached, but saved only in the testMode space)
 *   string deviceType: Android, Apple, or Other
 *   string browser: Chrome, Safari, or Other
 *   int cameraCount: number of cameras in the device
 *   bool frontCamera: true to use front camera instead of rear (default false iff mobile)
 *   bool online: true if the device is connected to the Internet
 * 
 * ARRAYS
 *    choices: a list of Common Good accounts the signed-in user may choose to connect (one of) to the device
 *      accountId: the account ID including cardCode
 *      deviceId: a unique ID for the device associated with the account
 *      name: the name on the account
 *      qr: an image of the account’s QR code and ID photo (if any)
 *      isCo: true if the account is a company account
 *      selling: a ist of items for sale
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
 *    corrupt: a collection of corrupt data
 *    accts: an array of accounts the device has transacted with, keyed by the account ID without cardCode, each with:
 *      hash: SHA256 hash of cardCode
 *      data: JSON object of other account data:
 *        name: name of the account
 *        agent: agent for the account, if any
 *        location: location of the account (city, ST
 *        limit: maximum amount this account can be charged at this time (leaving room for Stepups)
 *        creditLine: the account's credit line
 *        avgBalance: the account’s average balance over the past 6 months
 *        trustRatio: ratio of the account’s trust rating to the average trust rating of all individual accounts (zero for company accounts)
 *        since: Unix timestamp of when the account was activated
 * 
 *    myAccount: information about the account associated with the device
 *      accountId, deviceId, name, qr, isCo, and selling as in the choices array described above
 */

export const createStore = () => {
  const url = window.location.href
  const testKey = 'cgpay.test'
  const realKey = 'cgpay.real'
  const testModeKey = 'cgpay.testMode'
  let testing = !/^https:\/\/app.commongood.earth/.test(url) || JSON.parse(window.localStorage.getItem(testModeKey))
  //testing = false // uncomment this to test the automatic switch to test mode when a test card is scanned
  window.localStorage.setItem(testModeKey, testing)
  const storedState = JSON.parse(window.localStorage.getItem(testing ? testKey : realKey))
  const lostMsg = `Tell the customer "I'm sorry, that card is marked "LOST or STOLEN".`

  const defaults = {
    testing: testing,
    online: null,
    cameraCount: 0, // set this when scanning for the first time
    qr: null,
    msg: null,
    erMsg: null,
    sawAdd: false,
    choices: null,
    accts: {},
    txs: [],
    comments: [],
    myAccount: null,

    deviceType: getDeviceType(),
    browser: getBrowser(),
    frontCamera: (getDeviceType() == 'Other'),
  }

  // --------------------------------------------

  let cache = storedState || { ...defaults }
  cache.testing = testing // never gets stored
  const { zot, subscribe, update } = writable(cache)

  // --------------------------------------------

  function getDeviceType() {
    const { userAgent } = window.navigator
    if (/Android/i.test(userAgent)) { return 'Android' }
    if (/iPhone|iPod|iPad/i.test(userAgent)) { return 'Apple' }
    return 'Other'
  }

  function getBrowser() {
    if (/chrome/i.test(navigator.userAgent)) return 'Chrome'
    if (/safari/i.test(navigator.userAgent)) return 'Safari'
    return 'Other'
  }

  function canAddToHome() { 
    if (res.sawAdd) return false
    return ((res.isApple() && res.isSafari()) || (res.isAndroid() && res.isChrome()))
  }

  function storeLocal(state) {
    window.localStorage.setItem(testing ? testKey : realKey, JSON.stringify(state))
    cache = state
    return state
  }

  function set(k, v) { update(st => {
    st[k] = v
    return storeLocal(st)
  })}

  function enQ(k, v) { update(st => {
    st[k].push(v)
    return storeLocal(st)
  })}

  function deQ(k) { update(st => { // this is actually FIFO (shift) not LIFO (pop)
    console.log(k, st[k])
    st[k].shift()
    return storeLocal(st)
  })}

  async function flushQ(k, endpoint) {
    if (cache.corrupt) return // don't retry hopeless tx indefinitely
    const q = [ ...cache[k] ]
    let i
    for (i in q) {
      try {
        sendRequest(q[i], endpoint)
      } catch (er) {
        if (isTimeout(er)) {
          res.setOnline(false)
          return
        } else {
          console.log(er.message) // keep this
          console.log(cache[k]) // keep this
          return res.setCorrupt(cache[k])
        }
      }
      deQ(k)
    }
  }

  // --------------------------------------------

  const res = {
    subscribe,

    inspect() { return cache },

    setTesting(yesno) { update(st => {
      window.localStorage.setItem(testModeKey, JSON.stringify(yesno))
      st.testing = yesno
      return st
    })},

    setQr(v) { set('qr', v) },
    setMsg(v) { set('erMsg', v) },
    setCorrupt(data) { set('corrupt', data) }, // record information for tech crew to decipher

    api() { return testing ? _demoApi_ : _demoApi_ }, // _realApi_ },

    setAcctChoices(v) { set('choices', v) },
    setMyAccount(acct) { set('myAccount', acct ? { ...acct } : null) },
    isSignedIn() { return (cache.myAccount != null) },
    signOut() { set('myAccount', null) },
    clearData() { update(st => {
        st = { ...defaults }
        st.testing = true // only called in test mode
        return storeLocal(st)
    })},

    addableToHome() { return canAddToHome() },
    sawAddToHome() { set('sawAdd', Date.now()) },
    isApple() { return (cache.deviceType == 'Apple') },
    isAndroid() { return (cache.deviceType == 'Android') },
    isChrome() { return (cache.browser == 'Chrome') },
    isSafari() { return (cache.browser == 'Safari') },
    setCameraCount(n) { set('cameraCount', n) },
    setFrontCamera(yesno) { set('frontCamera', yesno) },

    resetNetwork() { this.setOnline(window.navigator.onLine) },
    setOnline(yesno) {
      if (yesno) { this.flushTxs(); this.flushComments() }
      set('online', yesno) // it makes no sense to store this in localStore, but hurts nothing
    },

    /**
     * Store the given data about a customer account
     * @param {*} card: account identification parsed from QR
     * @param {*} acctData: information about a customer
     */
    putAcct(card, acctData) { update(st => {
      st.accts[card.acct] = { hash: card.hash, data: { ...acctData } } // only the hash of the security code gets stored
      return storeLocal(st)
    })},
    getAcct(card) {
      const acct = cache.accts[card.acct]
      if (acct == undefined) return null
      if (card.hash != acct.hash) return null // if later a new hash is validated, this entry will get updated
      if (acct.data == null) throw new Error(lostMsg) // if we encounter a hash collision for such a short string, it will be an important engineering discovery
      return acct.data
    },

    deleteTxPair() {
      update(st => {
        const q = [ ...st.txs ]
        const tx2 = q.pop()
        const tx1 = q.pop()
        if (tx1 && tx2 && tx2.created == tx1.created && tx2.amount == -tx1.amount) return storeLocal({ ...st, txs: q })
        return st
      })
    },

    enqTx(tx) {
      tx.offline = true
      enQ('txs', { ...tx })
    },
    async flushTxs() { flushQ('txs', 'transactions') },
    deqTx() { return deQ('txs') }, // just for testing (in store.spec.js)

    comment(text) { enQ('comments', { deviceId: cache.myAccount.deviceId, actorId: cache.myAccount.accountId, created: Math.floor(Date.now() / 1000), text: text }) },
    async flushComments() { flushQ('comments', 'comments') },

  }

  for (let k in cache) res[k] = cache[k]

  return res
}

// --------------------------------------------

export default createStore()
