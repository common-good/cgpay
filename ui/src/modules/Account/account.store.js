import { writable } from 'svelte/store'

// --------------------------------------------

export const createAccountStore = () => {
  const accountKey = 'cg.pay.account'
  const storedLocally = JSON.parse(window.localStorage.getItem(accountKey))

  const defaults = { account: null }

  // --------------------------------------------

  const initialData = storedLocally || defaults

  const { set, subscribe, update } = writable(initialData)

  // --------------------------------------------

  return {
    subscribe,

    clear: () => set(defaults),

    setAccount: (account) => update(() => {
      const newData = { account }

      window.localStorage.setItem(accountKey, JSON.stringify(newData))
      return newData
    })
  }
}

// --------------------------------------------

export default createAccountStore()
