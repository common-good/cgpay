import { createPreferencesStore } from './preferences.store.js'

// --------------------------------------------

describe('preferences.store', () => {
  const preferencesKey = 'cg.pay.preferences'

  beforeEach(() => {
    window.localStorage.setItem(preferencesKey, null)
  })

  describe('when there are existing values in local storage', () => {
    it('initializes to stored values', () => {
      window.localStorage.setItem(preferencesKey, JSON.stringify({
        foo: {
          bar: 'baz'
        }
      }))

      const preferencesStore = createPreferencesStore()

      preferencesStore.subscribe(preferences => {
        expect(preferences).toEqual({
          foo: {
            bar: 'baz'
          }
        })
      })
    })
  })

  describe('when there are not existing values in local storage', () => {
    it('initializes to default values', () => {
      const preferencesStore = createPreferencesStore()

      preferencesStore.subscribe(preferences => {
        expect(preferences).toHaveProperty('homeScreenPrompt')
      })
    })
  })

  describe('.skipHomeScreenPrompt()', () => {
    it('logs the time that the user skipped the home screen prompt', async () => {
      const preferencesStore = createPreferencesStore()

      const now = new Date()
      vi.useFakeTimers(now)

      preferencesStore.skipHomeScreenPrompt()

      // Confirm that both in-memory and local storage data are updated.
      preferencesStore.subscribe(preferences => {
        expect(preferences.homeScreenPrompt.skipped).toEqual(now)

        const stored = JSON.parse(window.localStorage.getItem(preferencesKey))
        expect(stored.homeScreenPrompt.skipped).toEqual(now.toISOString())
      })
    })
  })
})
