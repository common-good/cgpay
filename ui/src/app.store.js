import { writable } from 'svelte/store'

// --------------------------------------------

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
    accounts: {
      linked: null,
      possible: null
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

    transactions: {
      queued: []
    }
  }

  // --------------------------------------------

  let localState = storedState || defaults
  const { set, subscribe, update } = writable(localState)

  // --------------------------------------------

  function storeStateLocally(state) {
    window.localStorage.setItem(storeKey, JSON.stringify(state))
    return state
  }

  // --------------------------------------------

  return {
    subscribe,

    inspect() {
      return localState
    },

    accounts: {
      link(account) {
        update(currentState => {
          const newState = { ...currentState }

          newState.accounts.linked = account

          return storeStateLocally(newState)
        })
      },

      hasLinkedAccount() {
        return !!localState.accounts.linked
      },

      hasNoPossibleAccounts() {
        return !localState.accounts.possible
      },

      hasPossibleAccounts() {
        return !!localState.accounts.possible
      },

      setPossibleAccounts(accounts) {
        update(currentState => {
          const newState = { ...currentState }

          newState.accounts.possible = accounts

          return storeStateLocally(newState)
        })
      }
    },

    device: {
      isApple() {
        return localState.device.type === 'Apple'
      },

      isAndroid() {
        return localState.device.type === 'Android'
      }
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

          return storeStateLocally(newState)
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

    transactions: {
      async flush({ sendChargeRequest }) {
        const { queued } = localState.transactions

        for (let i = 0; i < queued.length; i++) {
          try {
            await sendChargeRequest({ transaction: queued[i] })
            this.dequeue(queued[i].id)
          }

          catch (error) {
            // TODO Handle charge request error.
          }
        }
      },

      dequeue(id) {
        update(currentState => {
          const newState = { ...currentState }

          newState.transactions.queued = newState.transactions.queued.filter(item => {
            return item.id !== id
          })

          return storeStateLocally(newState)
        })
      },

      queue(transaction) {
        update(currentState => {
          const newState = { ...currentState }

          newState.transactions.queued = [ ...newState.transactions.queued, transaction ]

          return storeStateLocally(newState)
        })
      }
    }
  }
}

// --------------------------------------------

export default createStore()
