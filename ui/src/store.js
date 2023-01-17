import { writable } from 'svelte/store'
import { sendTxRequest, isTimeout } from '#utils.js'

// --------------------------------------------
// use this example for set() and get(): https://svelte.dev/repl/ccbc94cb1b4c493a9cf8f117badaeb31?version=3.16.7

export const createStore = () => {
  const storeKey = 'cgpay.store'
  const storedState = JSON.parse(window.localStorage.getItem(storeKey))

  // --------------------------------------------

  function getDeviceType() {
    const { userAgent } = window.navigator

    if (/Android/i.test(userAgent)) {
      return 'Android'
    }

    if (/iPhone|iPod|iPad/i.test(userAgent)) {
      return 'Apple'
    }

    return 'Other'
  }

  // --------------------------------------------

  const defaults = {
    test: false, // using test API and test database?

    myAccount: {
      accountId: null,
      deviceId: null,
      name: null,
      items: []
    },

    device: {
      type: getDeviceType(),
    },

    homeScreen: {
      skipped: false
    },

    network: {
      offline: null,
      online: null,
      restored: false
    },

    txs: {
      queued: []
    },

    accts: [],
  }

  // --------------------------------------------

  let localState = storedState || defaults
  const { set, subscribe, update } = writable(localState)

  // --------------------------------------------

  function setOnline() { res.network.setOnline(false) }
  function flushTxs() { res.txs.flush() }
  function cardAcct(card) { return card.acct + (card.test ? '.' : '!') }

  function storeLocal(state) {
    window.localStorage.setItem(storeKey, JSON.stringify(state))
    localState = state
    return state
  }
  
  function setLocal(k, v) {
    update(currentState => {
      const newState = { ...currentState }
      newState[k] = v
      return storeLocal(newState)
    })
  }
  
  function setCookie(name, value) {
    document.cookie = `${ name }=${ JSON.stringify(value) }`
  }

  function getCookie(name, once = false) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    const res = v ? JSON.parse(v[2]) : null;
    console.log(res)
    if (once) setCookie(name, null)
    return res
  }
  
  function getCookieOnce(name) { return getCookie(name, true) }

  function cookieOps(name) {
    return {
      set(v) { return setCookie(name, v) },
      get() { return getCookie(name) }
    }
  }

  // --------------------------------------------

  const res = {
    subscribe,

    inspect() {
      return localState
    },

    api() { return localState.test ? __membersApi__ : __membersApi__ },
    
    myAccount: {
      set(acct) { update(st => {
          st.myAccount = { ...st.myAccount, ...acct }
          st.myAccount.deviceId = 'GrfaVyHkxnTf4cxsyIEjkWyNdK0wUoDK153r2LIBoFocvw73T'; st.myAccount.items = ['test food'] // DEBUG
          return storeLocal(st)
      })},
      exists() {return localState.myAccount.name !== null},
    },
    
    accountChoices: {
      set(v) { return setCookie('accountChoices', v) },
      get() { return getCookie('accountChoices') }
    },
    
    qr: {
      set(v) { return setCookie('qr', v) },
      get() { return getCookie('qr') }
    },
    
    errMsg: {
      set(v) { return setCookie('errMsg', v) },
      get() { return getCookie('errMsg') }
    },

    device: {
      isApple() { return localState.device.type === 'Apple' },
      isAndroid() { return localState.device.type === 'Android' }
    },

    homeScreen: {
      promptRequired() {
        const onMobileDevice = [ 'Apple', 'Android' ].includes(localState.device.type)
        const hasNotSkippedPrompt = !localState.homeScreen.skipped

        return onMobileDevice && hasNotSkippedPrompt
      },

      skip() { update(st => {
          st.homeScreen.skipped = new Date()
          return storeLocal(st)
      })}
    },

    network: {
      reset() { update(st => {
          this.setOnline(window.navigator.onLine)
          return st
      })},

      setOnline(yesno) {
//        console.log('online: ' + (yesno ? 'YES' : 'NO'))
        if (yesno) flushTxs()
        update(st => {
          st.network.online = yesno
          return st
        })
      },
    },

    accts: {
      put(card, acct) { update(st => {
          st.accts[cardAcct(card)] = acct
          return st
      })},
      get(card) {
        const res = localState.accts[cardAcct(card)]
        return res === undefined ? null : res
      }
    },

    txs: {
// was:      async flush({ sendTxRequest }) {
      async flush() {
        const { queued } = localState.txs
//        console.log(queued)
        let i

        for (i in queued) {
          try {
            await sendTxRequest(queued[i])
            this.dequeue(i)
          } catch (er) {
            if (isTimeout(er)) {
              setOnline()
              return
            }
            console.log(er.message)
            console.log(queued[i])
            throw(er)
          }
        }
      },

      dequeue(i) { update(st => {
          st.txs.queued = st.txs.queued.filter((_, index) => { index !== i })
          console.log(st.txs.queued)
          return storeLocal(st)
      })},

      queue(tx) {
        const key = Date.now() // this index will always be unique
        tx.offline = true
        update(st => {
          st.txs.queued[key] = tx
          console.log(st.txs.queued)
          return storeLocal(st)
        })
        return key
      }
    }
  }
  return res
}

// --------------------------------------------

export default createStore()
