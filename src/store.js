// use this example for setv() and get(): https://svelte.dev/repl/ccbc94cb1b4c493a9cf8f117badaeb31?version=3.16.7

/**
 * Handle stored values for the app (persistent and transient).
 * See data structure definition in cache.js
 */
import { writable } from 'svelte/store'
import u from '#utils.js'
import c from '#constants.js'
import cache0 from '#cache.js'

export const createStore = () => {
  const lostMsg = `Tell the customer "I'm sorry, that QR Code is marked "LOST or STOLEN".`

  let cache
  save({ ...cache, ...convert(getst()), version:c.version }) // update store with any changes in defaults (crucial for tests)
  const { subscribe, update } = writable(cache)
 
  function getst() { return {
    ...JSON.parse(localStorage.getItem(c.storeKey)),
    ...JSON.parse(sessionStorage.getItem(c.storeKey)),
  }}

  function save(s) {
    cache = { ...s }
    localStorage.setItem(c.storeKey, JSON.stringify(u.just(cache0.persist, s)))
    sessionStorage.setItem(c.storeKey, JSON.stringify(u.justNot(cache0.persist, s)))
    return s
  }

  function setst(newS) { update(s => { return save(newS) } )}
  function setv(k, v, fromTest = false) { update(s => { s[k] = v; return save(s) }); tSetV(k, v, fromTest); return v }
  function enQ(k, v) { st.bump('enQ'); cache[k].push(v); return setv(k, cache[k]) }
  function deQ(k) { st.bump('deQ'); cache[k].shift(); return setv(k, cache[k]) } // this is actually FIFO (shift) not LIFO (pop)
  function tSetV(k, v, fromTest) { if (u.testing() && !fromTest) u.tellTester('store', k, v).then() }

  let doing = false // true if we are handling a list of things the tester has told us (the app) to do
  let flushing = {} // queue name set true if we are flushing

  async function flushQ(k, endpoint) {
    if (flushing[k]) return; else flushing[k] = true
    if (cache.corrupt == c.version) return; else if (cache.corrupt) st.setCorrupt(null) // don't retry hopeless tx indefinitely
    while (cache[k].length > 0) {
      if (!cache.useWifi) return; // allow immediate interruptions when testing
      try {
        await u.postRequest(endpoint, cache[k][0])
      } catch (er) {
        flushing[k] = false
        if (u.isTimeout(er)) {
          st.setOnline(false)
        } else {
          console.log('corrupt er:', er) // keep this
          console.log('corrupt cache', k, cache[k]) // keep this
          st.setCorrupt(c.version)
          if (u.testing()) throw 'corrupt'
        }
        return // don't deQ when there's an error
      }
      deQ(k)
    }
    flushing[k] = false
  }

  const st = {
//    subscribe,
    subscribe(func) { // extend the writable subscribe method to check messages from test framework first
      st.fromTester().then() // make sure we have the latest data before fulfilling a subscription
      return subscribe(func)
    },

    async fromTester() { // called only in test mode (see Route.svelte, hooks.js, and t.tellApp)
      if (u.testing() && !doing) {
        doing = true
        u.tellTester('tellme').then(todo => { // if we have a todo list, another thread is already handling it
          if (!todo) return doing = false
          let k, v
          while (todo.length) { // for each item
            ({ k, v } = todo.shift())
            if (k == 'clear') {
              st.clearData()
            } else setv(k, v, true)
          }
          u.tellTester('done').then(() => doing = false)
        })
      }
    },
    inspect() { return cache },

    bump(k)  { if (u.testing()) { cache[k]++; setv(k, cache[k]) } },

    setQr(v) { setv('qr', v) },
    setIntent(v) { setv('intent', v) },
    setMsg(v) { setv('erMsg', v) },
    setCorrupt(version) { setv('corrupt', version) }, // pause uploading until a new version is released
    setWifi(yesno) { setv('useWifi', yesno); st.resetNetwork() },
    setSelfServe(yesno) { setv('selfServe', yesno) },
    setCoPaying(yesno) { setv('coPaying', yesno) },
    setPayOk(v) { setv('payOk', v) },

    setAcctChoices(v) { setv('choices', v); if (v) reconcileDeviceIds(v) },
    setMyAccount(acct) { setv('myAccount', acct ? { ...acct } : null) },
    linked() { return (cache.myAccount !== null) },
    unlink() { setv('myAccount', null) },
    signOut() { st.unlink(); st.setAcctChoices(null) },
    clearData() { if (!u.realData()) setst({ ...cache0 }) },

    setSawAdd() { setv('sawAdd', u.now()) },
    setCameraCount(n) { setv('cameraCount', n) },
    setFrontCamera(yesno) { setv('frontCamera', yesno) },

    resetNetwork() { if (cache.useWifi) st.setOnline(navigator.onLine) },
    setOnline(yesno) { // handling this in store helps with testing
      const v = cache.useWifi ? yesno : false
      if (v !== cache.online) setv('online', v)
      if (cache.useWifi && yesno) st.flushAll().then() // when testing only do *explicit* flushing
    },

    /**
     * Set inactivity timeout
     * @param int t: omitted=decrement by one timer cycle, null=cancel timeout, n=number of seconds before return to Home Page
     * @return new value of timeout
     */
    setTimeout(t = -1) { // -1 means one timer cycle
      t = t == -1 ? Math.max(0, cache.timeout - c.networkTimeoutMs) // decrement
      : t === null ? null // cancel
      : 1000 * (u.testing() ? c.testTimeout : t) // set
      return setv('timeout', t )
    },

    /**
     * Store the given data about a customer account
     * @param {*} card: account identification parsed from QR
     * @param {*} acctData: information about a customer
     */
    putAcct(card, acctData) {
      cache.accts[card.acct] = { ...acctData, hash: card.hash } // only the hash of the security code gets stored
      return setv('accts', cache.accts)
    },
    getAcct(card) {
      let acct = cache.accts[card.acct]
      if (acct == undefined) return null
      if (card.hash != acct.hash) return null // if later a new hash is validated, this entry will get updated
      if (acct.name === null) throw new Error(lostMsg) // if we encounter a hash collision for such a short string, it will be an important engineering discovery
      return acct
    },

    enqTx(tx) { tx.offline = true; enQ('txs', { ...tx }) },
    async flushTxs() { await flushQ('txs', 'transactions') },
    deqTx() { deQ('txs') }, // just for testing (in store.spec.js)
    comment(text) { enQ('comments', { deviceId:cache.deviceId, actorId:cache.myAccount.accountId, created:u.now(), text:text }) },
    async flushComments() { await flushQ('comments', 'comments') },
    async flushAll() {
      if (u.testing() && !cache.flushOk) return
      if (u.empty(cache.txs) && u.empty(cache.comments)) return
      await st.flushTxs()
      await st.flushComments()
      if (u.testing()) setv('flushOk', false)
    },
  }

  return st
}

function reconcileDeviceIds(chx) {
  let s = getst()
  let ids = s.deviceIds
  let i, ch, old
  for (i in chx) {
    ch = chx[i]
    old = ids[ch.accountId]
    if (old) chx[i].deviceId = old; else ids[ch.accountId] = ch.deviceId
  }
  return [setv('choices', chx), setv('deviceIds', ids)] // setv for call from setAcctChoices, return for call from convert()
}

function convert(s) {
  if (u.empty(s) || c.version == s.version) return s
  if (u.empty(s.version)) { // v4.0.0 has no stored version number
    if (s.choices) [s.choices, s.deviceIds] = reconcileDeviceIds(s.choices)
    if (s.myAccount) s.deviceIds[s.myAccount.accountId] = s.myAccount.deviceId
  }

  return s
}

export default createStore()
