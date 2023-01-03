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


  describe('.myAccount', () => {
    it('is accessible', () => {
      const store = createStore()
      expect(store.inspect().myAccount.name).toEqual(null)
    })

    describe('.has()', () => {
      describe('when there is a linked account', () => {
        it('is true', () => {
          setupLocalStorage({
            myAccount: {name: 'bar'}
          })
          const store = createStore()
          expect(store.myAccount.has()).toEqual(true)
        })
      })

      describe('when there is not a linked business', () => {
        it('is false', () => {
          setupLocalStorage({
            myAccount: {name: null}
          })

          const store = createStore()
          expect(store.myAccount.has()).toEqual(false)
        })
      })
    })

    describe('.set()', () => {
      it('links the given account', () => {
        const store = createStore()
        store.myAccount.set({name: 'Biz'})

        expect(getLocallyStored().myAccount.name).toEqual('Biz')
        expect(store.inspect().myAccount.name).toEqual('Biz')
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

/*
    describe('.signIn()', () => {
      it('gets a list of options for an account to link', () => {
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
    */

  describe('.device', () => {
    describe('.type', () => {
      describe('when the user is on an Android mobile device', () => {
        it('is Android', () => {
          const originalNavigator = window.navigator

          window.navigator = {
            userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-S906N Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/80.0.3987.119 Mobile Safari/537.36'
          }

          const store = createStore()
          expect(store.inspect().device.type).toEqual('Android')

          window.navigator = originalNavigator
        })
      })

      describe('when the user is on an Apple mobile device', () => {
        it('is Apple', () => {
          const originalNavigator = window.navigator

          window.navigator = {
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1'
          }

          const store = createStore()
          expect(store.inspect().device.type).toEqual('Apple')

          window.navigator = originalNavigator
        })
      })

      describe('when the user is on not on a mobile device', () => {
        it('is Other', () => {
          const originalNavigator = window.navigator

          window.navigator = {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36'
          }

          const store = createStore()
          expect(store.inspect().device.type).toEqual('Other')

          window.navigator = originalNavigator
        })
      })
    })

    describe('.isAndroid()', () => {
      describe('when the user is on an Android device', () => {
        it('is true', () => {
          setupLocalStorage({
            device: {
              type: 'Android',
            }
          })

          const store = createStore()
          expect(store.device.isAndroid()).toEqual(true)
        })
      })

      describe('when the user is not on a Android device', () => {
        it('is false', () => {
          setupLocalStorage({
            device: {
              type: 'Apple',
            }
          })

          const store = createStore()
          expect(store.device.isAndroid()).toEqual(false)
        })
      })
    })

    describe('.isApple()', () => {
      describe('when the user is on an Apple device', () => {
        it('is true', () => {
          setupLocalStorage({
            device: {
              type: 'Apple',
            }
          })

          const store = createStore()
          expect(store.device.isApple()).toEqual(true)
        })
      })

      describe('when the user is not on a Apple device', () => {
        it('is false', () => {
          setupLocalStorage({
            device: {
              type: 'Android',
            }
          })

          const store = createStore()
          expect(store.device.isApple()).toEqual(false)
        })
      })
    })
  })

  describe('.homeScreen', () => {
    describe('.promptRequired()', () => {
      describe('when the user is on an Apple device and has not previously skipped the prompt', () => {
        it('is true', () => {
          setupLocalStorage({
            device: {
              type: 'Apple'
            },

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
            device: {
              type: 'Android'
            },

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
            device: {
              type: 'Other'
            },

            homeScreen: {
              skipped: false
            }
          })

          const store = createStore()
          expect(store.homeScreen.promptRequired()).toEqual(false)
        })
      })

      describe('when the user has previously skipped the prompt', () => {
        it('is false', () => {
          setupLocalStorage({
            device: {
              type: 'Apple'
            },

            homeScreen: {
              skipped: true
            }
          })

          const store = createStore()
          expect(store.homeScreen.promptRequired()).toEqual(false)
        })
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

  describe('.transactions', () => {
    describe('.dequeue', () => {
      it('dequeues the transaction with given ID', () => {
        const store = createStore()

        store.transactions.queue({ id: '1' })
        store.transactions.queue({ id: '2' })
        store.transactions.queue({ id: '3' })

        store.transactions.dequeue('2')

        // Confirm that all forms of store access are updated.
        expect(getLocallyStored().transactions.queued).toHaveLength(2)
        expect(store.inspect().transactions.queued).toHaveLength(2)
        store.subscribe(state => expect(state.transactions.queued).toHaveLength(2))

        expect(store.inspect().transactions.queued).toEqual([
          { id: '1' },
          { id: '3' }
        ])
      })
    })

    describe('.flush', () => {
      it('sends all requests', async () => {
        const sendChargeRequest = vi.fn()
        const store = createStore()

        store.transactions.queue({ id: '1', amount: 1, description: '1' })
        store.transactions.queue({ id: '2', amount: 2, description: '2' })
        store.transactions.queue({ id: '3', amount: 3, description: '3' })

        await store.transactions.flush({ sendChargeRequest })

        expect(sendChargeRequest.calls).toHaveLength(3)
        expect(sendChargeRequest.calls[0][0].transaction).toEqual({ id: '1', amount: 1, description: '1' })
        expect(sendChargeRequest.calls[1][0].transaction).toEqual({ id: '2', amount: 2, description: '2' })
        expect(sendChargeRequest.calls[2][0].transaction).toEqual({ id: '3', amount: 3, description: '3' })
      })

      describe('when a request is successful', () => {
        it('dequeues the request', async () => {
          const sendChargeRequest = vi.fn()
          const store = createStore()

          store.transactions.queue({ id: '1', amount: 1, description: '1' })
          store.transactions.queue({ id: '2', amount: 2, description: '2' })
          store.transactions.queue({ id: '3', amount: 3, description: '3' })

          expect(store.inspect().transactions.queued).toHaveLength(3)
          await store.transactions.flush({ sendChargeRequest })
          expect(store.inspect().transactions.queued).toHaveLength(0)
        })
      })

      describe('when a request fails', () => {
        it('keeps the request in the queue', async () => {
          let callCount = 0

          async function sendChargeRequest() {
            callCount++

            if (callCount === 2) {
              throw new Error()
            }
          }

          const store = createStore()

          store.transactions.queue({ id: '1' })
          store.transactions.queue({ id: '2' })
          store.transactions.queue({ id: '3' })

          expect(store.inspect().transactions.queued).toHaveLength(3)
          await store.transactions.flush({ sendChargeRequest })
          expect(store.inspect().transactions.queued).toHaveLength(1)

          expect(store.inspect().transactions.queued[0]).toEqual({ id: '2' })
        })
      })
    })

    describe('.queue', () => {
      it('stores the transaction', () => {
        const store = createStore()
        store.transactions.queue({ id: '1' })

        // Confirm that all forms of store access are updated.
        expect(getLocallyStored().transactions.queued).toHaveLength(1)
        expect(store.inspect().transactions.queued).toHaveLength(1)
        store.subscribe(state => expect(state.transactions.queued).toHaveLength(1))

        expect(store.inspect().transactions.queued[0]).toEqual({ id: '1' })
      })
    })
  })
})
