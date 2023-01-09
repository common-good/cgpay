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
    auth: null,
    
    myAccount: {name: null},

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

    transactions: {
      queued: []
    }
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

    myAccount: {
      set(account) {
        update(currentState => {
          const newState = { ...currentState }
          newState.myAccount = {...newState.myAccount, ...account}
          newState.myAccount.deviceId = 'GrfaVyHkxnTf4cxsyIEjkWyNdK0wUoDK153r2LIBoFocvw73T'; newState.myAccount.items = ['test food']
          return storeLocal(newState)
        })
      },
      has() {return localState.myAccount.name !== null},
    },
    
    accountChoices: {
      set(v) { return setCookie('accountChoices', v) },
      get() { return getCookieOnce('accountChoices') }
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
        update(currentState => {
          const newState = { ...currentState }
          newState.homeScreen.skipped = new Date()
          return storeLocal(newState)
        })
      }
    },

    network: {
      reset() {
        update(currentState => {
          const newState = { ...currentState }
          newState.network.restored = false
          return newState
        })
      },

      setOffline() {
        update(currentState => {
          const newState = { ...currentState }
          newState.network.offline = true
          newState.network.online = false
          return newState
        })
      },

      setOnline() {
        update(currentState => {
          const newState = { ...currentState }
          newState.network.offline = false
          newState.network.online = true
          return newState
        })
      },

      setRestored() {
        update(currentState => {
          const newState = { ...currentState }
          newState.network.offline = false
          newState.network.online = true
          newState.network.restored = true
          return newState
        })
      },
    },

    txs: {
      async flush({ sendChargeRequest }) {
        const { queued } = localState.txs

        for (let i = 0; i < queued.length; i++) {
          try {
            await sendChargeRequest(queued[i])
            this.dequeue(queued[i].id)
          } catch (e) {
            // TODO Handle charge request error.
          }
        }
      },

      dequeue(id) {
        update(currentState => {
          const newState = { ...currentState }
          newState.txs.queued = newState.txs.queued.filter(item => { return item.id !== id })
          return storeLocal(newState)
        })
      },

      queue(tx) {
        update(currentState => {
          const newState = { ...currentState }
          newState.txs.queued = [ ...newState.txs.queued, tx ]
          return storeLocal(newState)
        })
      }
    }
  }
}

// --------------------------------------------

export default createStore()
