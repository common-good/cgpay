import { get, writable } from 'svelte/store'
import { sendTxRequest, isTimeout } from '#utils.js'

// --------------------------------------------
// use this example for set() and get(): https://svelte.dev/repl/ccbc94cb1b4c493a9cf8f117badaeb31?version=3.16.7

export const createStore = () => {
  const testKey = 'cgpay.testing'
  const realKey = 'cgpay.store'
  const testModeKey = 'cgpay.testMode'
  const testing = window.localStorage.getItem(testModeKey)
//  const testing = true
  const storedState = JSON.parse(window.localStorage.getItem(testing ? testKey : realKey))
  const lostMsg = `Tell the customer "I'm sorry, that card is marked "LOST or STOLEN".`

  const defaults = {
    homeSkipped: false,
    accounts: null,
    accts: {},
    queue: [],

    isSignedIn: false,
    isBusiness: false,

    myAccount: {
      accountId: null,
      deviceId: null,
      name: null,
      selling: []
    },

    device: {
      type: getDeviceType(),
    },

    network: {
      offline: null,
      online: null,
      restored: false
    },

  }

  // --------------------------------------------

  let cache = storedState || defaults
  cache.testing = testing
  const { zot, subscribe, update } = writable(cache)

  // --------------------------------------------

  function getDeviceType() {
    const { userAgent } = window.navigator
    if (/Android/i.test(userAgent)) { return 'Android' }
    if (/iPhone|iPod|iPad/i.test(userAgent)) { return 'Apple' }
    return 'Other'
  }

  function setOffline() { res.network.setOnline(false) }
  function flushTxs() { res.txs.flush() }
  function corrupt(data) { res.setCorrupt(data) }

  function storeLocal(state, key = realKey) {
    window.localStorage.setItem(key, JSON.stringify(state))
    cache = state
    return state
  }

  function set(k, v, key = realKey) { update(st => {
    st[k] = v
    return storeLocal(st, key)
  })}

  /* (not yet used)

  function storeSession(state) {
    window.sessionStorage.setItem(realKey, JSON.stringify(state))
    cache = state // use same cache as for localStorage
    return state
  }

  function setCookie(name, value) {
    document.cookie = `${ name }=${ JSON.stringify(value) }`
  }

  function getCookie(name, once = false) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    const res = v ? JSON.parse(v[2]) : null
    if (once) setCookie(name, null)
    return res
  }
  
  function cookieOps(name) {
    return {
      set(v) { return setCookie(name, v) },
      get() { return getCookie(name) }
    }
  }
  */

  // --------------------------------------------

  const res = {
    subscribe,

    inspect() { return cache },

    setMode(yesno) { set('testing', yesno, testModeKey) },
    setQr(v) { set('qr', v) },
    setMsg(v) { set('erMsg', v) },
    setCorrupt(data) { set('corrupt', data) }, // record information for tech crew to decipher

    api() { return testing ? _demoApi_ : _demoApi_ }, // _realApi_ },

    // Authentication
    signIn() { set('isSignedIn', true) },
    signOut() { 
        set('isSignedIn', false)
        set('isBusiness', false)
        set('myAccount', {}) 
    },
    setIsBusiness() { set('isBusiness', true) },
    
    myAccount: {
      setChoices(v) { set('choices', v) },
      set(acct) { set('myAccount', { ...cache.myAccount, ...acct }) },
      exists() { return (cache.myAccount.name != null) },
      empty() { return (cache.myAccount.name == null) },
    },

    device: {
      isApple() { return (cache.device.type == 'Apple') },
      isAndroid() { return (cache.device.type == 'Android') }
    },

    homeScreen: {
      promptRequired() {
        const onMobileDevice = [ 'Apple', 'Android' ].includes(cache.device.type)
        return onMobileDevice && !cache.homeSkipped
      },
      skip() { set('homeSkipped', new Date()) },
    },

    network: {
      reset() { this.setOnline(window.navigator.onLine) },
      setOnline(yesno) {
        if (yesno) flushTxs()
        update(st => {
          st.network.online = yesno
          return st // this does not get stored in localStorage
        })
      },
    },

    accts: {
      /**
       * Store the given data about a customer account
       * @param {*} card: account identification parsed from QR
       * @param {*} acctData: information about a customer
       * @todo: when we receive an array of bad qrs from the server, store acctData as null
       */
      put(card, acctData) { update(st => {
        st.accts[card.acct] = { hash: card.hash, data: { ...acctData } } // only the hash of the security code gets stored
        return storeLocal(st)
      })},
      get(card) {
        const acct = cache.accts[card.acct]
        if (acct == undefined) return null
        if (card.hash != acct.hash) return null // if later a new hash is validated, this entry will get updated
        if (acct.data == null) throw new Error(lostMsg) // if we encounter a hash collision for such a short string, it will be an important engineering discovery
        return acct.data
      }
    },

    txs: {
      async flush() {
        if (cache.corrupt) return // don't retry hopeless tx indefinitely
        const q = [ ...cache.queue ]
        let i
        for (i in q) {
          try {
            await sendTxRequest(q[i])
            this.dequeue()
          } catch (er) {
            if (isTimeout(er)) {
              setOffline()
              return
            } else {
              console.log(er.message) // keep this
              console.log(cache.queue) // keep this
              return corrupt(cache.queue)
            }
          }
        }
      },

      deletePair() {
        update(st => {
          const q = [ ...st.queue ]
          const tx2 = q.pop()
          const tx1 = q.pop()
          if (tx1 && tx2 && tx2.created == tx1.created && tx2.amount == -tx1.amount) return storeLocal({ ...st, queue: q })
          return st
        })
      },

      dequeue() { // called only from flush() and tests
        update(st => {
          st.queue.shift()
          return storeLocal(st)
        })
      },

      queue(tx) {
        tx.offline = true
        update(st => {
          st.queue.push({ ...tx })
          return storeLocal(st)
        })
      }
    }
  }
  return res
}

// --------------------------------------------

export default createStore()
