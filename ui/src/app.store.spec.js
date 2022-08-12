import { createStore } from './app.store.js'

// --------------------------------------------

const storeKey = 'cgpay.store'

function getLocallyStored() {
  return JSON.parse(window.localStorage.getItem(storeKey))
}

function setupLocalStorage(data) {
  return window.localStorage.setItem(storeKey, JSON.stringify(data))
}

// --------------------------------------------

describe('app.store', () => {
  beforeEach(() => {
    window.localStorage.setItem(storeKey, null)
  })

  describe('when there are existing values in local storage', () => {
    it('initializes to stored values', () => {
      setupLocalStorage({
        foo: {
          bar: 'baz'
        }
      })

      const store = createStore()

      expect(store.inspect()).toEqual({
        foo: {
          bar: 'baz'
        }
      })
    })
  })

  describe('when there are not existing values in local storage', () => {
    it('initializes to default values', () => {
      const store = createStore()
      expect(store.inspect().homeScreen.skipped).toEqual(false)
    })
  })

  describe('.auth', () => {
    describe('.account', () => {
      it('is accessible', () => {
        const store = createStore()
        expect(store.inspect().auth.account).toEqual(null)
      })
    })

    describe('.token', () => {
      it('is accessible', () => {
        const store = createStore()
        expect(store.inspect().auth.token).toEqual(null)
      })
    })

    describe('.isAuthenticated()', () => {
      describe('when a token is set', () => {
        it('returns true', () => {
          setupLocalStorage({
            auth: {
              token: 'token'
            }
          })

          const store = createStore()
          expect(store.auth.isAuthenticated()).toEqual(true)
        })
      })

      describe('when a token is not set', () => {
        it('returns false', () => {
          setupLocalStorage({
            auth: {
              token: null
            }
          })

          const store = createStore()
          expect(store.auth.isAuthenticated()).toEqual(false)
        })
      })
    })

    describe('.isNotAuthenticated()', () => {
      describe('when a token is set', () => {
        it('returns false', () => {
          setupLocalStorage({
            auth: {
              token: 'token'
            }
          })

          const store = createStore()
          expect(store.auth.isNotAuthenticated()).toEqual(false)
        })
      })

      describe('when a token is not set', () => {
        it('returns false', () => {
          setupLocalStorage({
            auth: {
              token: null
            }
          })

          const store = createStore()
          expect(store.auth.isNotAuthenticated()).toEqual(true)
        })
      })
    })

    describe('.business', () => {
      describe('.linked', () => {
        it('is accessible', () => {
          const store = createStore()
          expect(store.inspect().business.linked).toEqual(null)
        })
      })

      describe('.isLinked()', () => {
        describe('when there is a linked business', () => {
          it('is true', () => {
            setupLocalStorage({
              business: {
                linked: {}
              }
            })

            const store = createStore()
            expect(store.business.isLinked()).toEqual(true)
          })
        })

        describe('when there is not a linked business', () => {
          it('is false', () => {
            setupLocalStorage({
              business: {
                linked: null
              }
            })

            const store = createStore()
            expect(store.business.isLinked()).toEqual(false)
          })
        })
      })

      describe('.link()', () => {
        it('links the given business', () => {
          const store = createStore()
          store.business.link('Biz')

          expect(getLocallyStored().business.linked).toEqual('Biz')
          expect(store.inspect().business.linked).toEqual('Biz')
        })
      })
    })

    describe('.network', () => {
      describe('.offline', () => {
        it('is accessible', () => {
          const store = createStore()
          expect(store.inspect().network.offline).toEqual(null)
        })
      })

      describe('.online', () => {
        it('is accessible', () => {
          const store = createStore()
          expect(store.inspect().network.online).toEqual(null)
        })
      })

      describe('.restored', () => {
        it('is accessible', () => {
          const store = createStore()
          expect(store.inspect().network.restored).toEqual(false)
        })
      })

      describe('.reset()', () => {
        it('resets the network to basic online status', () => {
          const store = createStore()
          store.network.setRestored()
          store.network.reset()

          expect(store.inspect().network.offline).toEqual(false)
          expect(store.inspect().network.online).toEqual(true)
          expect(store.inspect().network.restored).toEqual(false)
        })
      })

      describe('.setOffline()', () => {
        it('sets the network status to offline', () => {
          const store = createStore()
          store.network.setOffline()

          expect(store.inspect().network.offline).toEqual(true)
          expect(store.inspect().network.online).toEqual(false)
          expect(store.inspect().network.restored).toEqual(false)
        })
      })

      describe('.setOnline()', () => {
        it('sets the network status to online', () => {
          const store = createStore()
          store.network.setOnline()

          expect(store.inspect().network.offline).toEqual(false)
          expect(store.inspect().network.online).toEqual(true)
          expect(store.inspect().network.restored).toEqual(false)
        })
      })

      describe('.setRestored()', () => {
        it('sets the network status to restored', () => {
          const store = createStore()
          store.network.setRestored()

          expect(store.inspect().network.offline).toEqual(false)
          expect(store.inspect().network.online).toEqual(true)
          expect(store.inspect().network.restored).toEqual(true)
        })
      })
    })

    describe('.signIn()', () => {
      it('sets the account and token', () => {
        const store = createStore()

        store.auth.signIn({ account: 'account', token: 'token' })

        // Confirm that all forms of store access are updated.
        expect(getLocallyStored().auth.account).toEqual('account')
        expect(store.inspect().auth.account).toEqual('account')
        store.subscribe(state => expect(state.auth.account).toEqual('account'))

        expect(getLocallyStored().auth.token).toEqual('token')
        expect(store.inspect().auth.token).toEqual('token')
        store.subscribe(state => expect(state.auth.token).toEqual('token'))
      })
    })

    describe('.signOut()', () => {
      it('clears the account and token', () => {
        setupLocalStorage({
          auth: {
            account: 'account',
            token: 'token'
          }
        })

        const store = createStore()

        // Confirm initial values are set.
        expect(store.inspect().auth.account).not.toEqual(null)
        expect(store.inspect().auth.token).not.toEqual(null)

        store.auth.signOut()

        // Confirm that all forms of store access are updated.
        expect(getLocallyStored().auth.account).toEqual(null)
        expect(store.inspect().auth.account).toEqual(null)
        store.subscribe(state => expect(state.auth.account).toEqual(null))

        expect(getLocallyStored().auth.token).toEqual(null)
        expect(store.inspect().auth.token).toEqual(null)
        store.subscribe(state => expect(state.auth.token).toEqual(null))
      })
    })
  })

  describe('.homeScreen', () => {
    describe('.promptRequired()', () => {
      describe('when the user is on an Apple device and has not previously skipped the prompt', () => {
        it('is true', () => {
          setupLocalStorage({
            deviceType: 'Apple',

            homeScreen: {
              skipped: false
            }
          })

          const store = createStore()
          expect(store.homeScreen.promptRequired()).toEqual(true)
        })
      })

      describe('when the user is on an Android device and has not previously skipped the prompt', () => {
        it('is true', () => {
          setupLocalStorage({
            deviceType: 'Android',

            homeScreen: {
              skipped: false
            }
          })

          const store = createStore()
          expect(store.homeScreen.promptRequired()).toEqual(true)
        })
      })

      describe('when the user is not on a mobile device', () => {
        it('is false', () => {
          setupLocalStorage({
            deviceType: 'Other',

            homeScreen: {
              skipped: false
            }
          })

          const store = createStore()
          expect(store.homeScreen.promptRequired()).toEqual(false)
        })
      })

      describe('when the user has previously skipped the prompt', () => {
        it('is false')
      })
    })
    describe('.skipped', () => {
      it('is accessible', () => {
        const store = createStore()
        expect(store.inspect().homeScreen.skipped).toEqual(false)
      })
    })

    describe('.skip()', () => {
      it('logs the time that the user skipped the home screen prompt', async () => {
        const store = createStore()

        vi.useFakeTimers()
        const now = new Date()

        // Confirm initial values are set.
        expect(store.inspect().homeScreen.skipped).toEqual(false)

        store.homeScreen.skip()

        // Confirm that all forms of store access are updated.
        expect(getLocallyStored().homeScreen.skipped).toEqual(now.toISOString())
        expect(store.inspect().homeScreen.skipped).toEqual(now)
        store.subscribe(state => expect(state.homeScreen.skipped).toEqual(now))
      })
    })
  })
})
