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
  
  function setCookie(name, value) {
    document.cookie = `${ name }=${ JSON.stringify(value) }`
  }

  function getCookie(name, once = false) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    const res = v ? JSON.parse(v[2]) : null
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
    
    erMsg: {
      set(v) { return setCookie('erMsg', v) },
      get() { return getCookie('erMsg') }
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
      async flush() {
        const queued = { ...localState.txs.queued }
        let i
        for (i in queued) {
          try {
            await sendTxRequest(queued[i])
            this.dequeue()
          } catch (er) {
            if (isTimeout(er)) {
              setOnline()
              return
            }
            console.log(er.message)
            console.log(localState.txs.queued[0])
            throw(er)
          }
        }
      },

      undo() {
        update(st => {
          const st0 = st
          const tx2 = st.txs.queued.pop()
          const tx1 = st.txs.queued.pop()
          return storeLocal((tx1 && tx2 && tx2.created == tx1.created && tx2.amount == -tx1.amount) ? st : st0)
        })
      },

      dequeue() { // called only from flush() and tests
        update(st => {
          st.txs.queued.shift()
          return storeLocal(st)
        })
      },

      queue(tx) {
        tx.offline = true
        update(st => {
          st.txs.queued.push(tx)
          return storeLocal(st)
        })
      }
    }
  }
  return res
}

// --------------------------------------------

export default createStore()
