import { writable } from 'svelte/store'

// --------------------------------------------

export const createPreferencesStore = () => {
  const preferencesKey = 'cg.pay.preferences'
  const storedLocally = JSON.parse(window.localStorage.getItem(preferencesKey))

  const defaults = {
    homeScreenPrompt: {
      skipped: null
    }
  }

  // --------------------------------------------

  const initialData = storedLocally || defaults

  const { set, subscribe, update } = writable(initialData)

  // --------------------------------------------

  return {
    subscribe,

    skipHomeScreenPrompt: () => update(data => {
      const newData = { ...data }
      newData.homeScreenPrompt.skipped = new Date()

      window.localStorage.setItem(preferencesKey, JSON.stringify(newData))
      return newData
    })
  }
}

// --------------------------------------------

export default createPreferencesStore()
