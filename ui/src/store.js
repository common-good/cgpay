import { writable } from 'svelte/store'

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
/* 
  function cookieOps(name) {
    return {
      set: (v) => { return setCookie(name, v) },
      get: () => { return getCookie(name) }
    }
  }
  */
  // --------------------------------------------

  return {
    subscribe,

    inspect() {
      return localState
    },

    api() { return localState.test ? __serverApi__ : __serverApi__ },
    
    myAccount: {
      set(acct) {
        update(st => {
          st.myAccount = { ...st.myAccount, ...acct }
          st.myAccount.deviceId = 'GrfaVyHkxnTf4cxsyIEjkWyNdK0wUoDK153r2LIBoFocvw73T'; st.myAccount.items = ['test food'] // DEBUG
          return storeLocal(st)
        })
      },
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

      skip() {
        update(st => {
          st.homeScreen.skipped = new Date()
          return storeLocal(st)
        })
      }
    },

    network: {
      reset() {
        update(st => {
          st.network.restored = false
          return st
        })
      },

      setOffline() {
        update(st => {
          st.network.offline = true
          st.network.online = false
          return st
        })
      },

      setOnline() {
        update(st => {
          st.network.offline = false
          st.network.online = true
          return st
        })
      },

      setRestored() {
        update(st => {
          st.network.offline = false
          st.network.online = true
          st.network.restored = true
          return st
        })
      },
    },

    accts: {
      put(acct) {
        update(st => {
          st.accts.push(acct)
          return st
        })
      },
      get(card) {
        const res = localState.accts.find(obj => obj.acct == card.acct)
        return res === undefined ? null : res
      }
    },

    txs: {
      async flush({ sendTxRequest }) {
        return // DEBUG
        const { queued } = localState.txs

        for (let i = 0; i < queued.length; i++) {
          try {
            await sendTxRequest(queued[i])
            this.dequeue(queued[i].id)
          } catch (er) {
            // TODO Handle charge request error.
          }
        }
      },

      dequeue() {
        update(st => {
          const res = st.txs.queued.shift()
          return storeLocal(st)
        })
      },

      queue(tx) {
        console.log(tx)
      }
    }
  }
}

// --------------------------------------------

export default createStore()
