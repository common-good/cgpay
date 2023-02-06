import { createStore } from './store.js'
import { sendTxRequest, isTimeout } from '#utils.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('#utils.js', () => ({
  sendTxRequest: vi.fn(),
  isTimeout: vi.fn()
}))

// --------------------------------------------

const storeKey = 'cgpay.store'

function storeState() {
  return JSON.parse(window.localStorage.getItem(storeKey))
}

function setupLocalStorage(data) {
  return window.localStorage.setItem(storeKey, JSON.stringify(data))
}

// --------------------------------------------

/* -- Skipping these tests for Alpha testing -- */

test.skip('store unit tests'), () => {
  describe('store', () => {
    beforeEach(() => {
      window.localStorage.setItem(storeKey, null)
      sendTxRequest = vi.fn()
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
        expect(store.inspect().homeSkipped).toEqual(false)
      })
    })


    describe('.myAccount', () => {
      it('is accessible', () => {
        const store = createStore()
        expect(store.inspect().myAccount.name).toEqual(null)
      })

      describe('.exists()', () => {
        describe('when there is a linked account', () => {
          it('is true', () => {
            setupLocalStorage({
              myAccount: {name: 'bar'}
            })
            const store = createStore()
            expect(store.myAccount.exists()).toEqual(true)
            expect(store.myAccount.empty()).toEqual(false)
          })
        })

        describe('when there is not a linked business', () => {
          it('is false', () => {
            setupLocalStorage({
              myAccount: {name: null}
            })

            const store = createStore()
            expect(store.myAccount.exists()).toEqual(false)
            expect(store.myAccount.empty()).toEqual(true)
          })
        })
      })

      describe('.set()', () => {
        it('links the given account', () => {
          const store = createStore()
          store.myAccount.set({name: 'Biz'})

          expect(storeState().myAccount.name).toEqual('Biz')
          expect(store.inspect().myAccount.name).toEqual('Biz')
        })
      })
    })

    describe('.accountChoices', () => {
      let store;
      beforeEach(() => {
        store = createStore()
      })

      it('is initialized as null', () => {
        expect(store.accountChoices.get()).toBeNull()
      })

      it('sets the correct account choices', () => {
        const acctChoices = [{ acct1: 'foo' }, {acct2: 'bar'} ]

        store.accountChoices.set(acctChoices)
        expect(store.accountChoices.get()).toEqual(acctChoices)
      })
    })

    describe('.qr', () => {
      let store;
      beforeEach(() => {
        store = createStore()
      })

      it('is initialized as null', () => {
        expect($store.qr).toBeNull()
      })

      it('sets the correct qr value', () => {
        const v = '123'

        store.qr.set(v)
        expect($store.qr).toEqual(v)
      })
    })

    describe('.erMsg', () => {
      let store;
      beforeEach(() => {
        store = createStore()
      })

      it('is initialized as null', () => {
        expect(store.erMsg).toBeNull()
      })

      it('sets the correct error message', () => {
        const msg = "error" 

        store.erMsg.set(msg)
        expect(store.erMsg).toEqual(msg)
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

      describe('.reset()', () => {
        it('resets the network to basic online status', () => {
          const store = createStore()
          store.network.reset()

          expect(store.inspect().network.online).toEqual(window.navigator.onLine)
        })
      })

      describe('.setOnline(yesno)', () => {
        it('sets the network status to online or offline', () => {
          const store = createStore()

          store.network.setOnline(true)
          expect(store.inspect().network.online).toEqual(true)

          store.network.setOnline(false)
          expect(store.inspect().network.online).toEqual(false)
        })
      })

    })

    describe('.accts', () => {
      it('updates data for a particular account', () => {
        const card = {acct: '123'}
        const store = createStore()

        store.accts.put(card, { foo: 'bar' })
        expect(store.accts.get(card)).toEqual({ foo: 'bar' })

        store.accts.put(card, { fizz: 'buzz' })
        expect(store.accts.get(card)).toEqual({ fizz: 'buzz' })
      })
    })

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

              homeSkipped: true,
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

              homeSkipped: true,
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

              homeSkipped: true,
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

              homeSkipped: true,
            })

            const store = createStore()
            expect(store.homeScreen.promptRequired()).toEqual(false)
          })
        })
      })

      describe('.skipped', () => {
        it('is accessible', () => {
          const store = createStore()
          expect(store.inspect().homeSkipped).toEqual(false)
        })
      })

      describe('.skip()', () => {
        it('logs the time that the user skipped the home screen prompt', async () => {
          const store = createStore()

          vi.useFakeTimers()
          const now = new Date()

          // Confirm initial values are set.
          expect(store.inspect().homeSkipped).toEqual(false)

          store.homeScreen.skip()

          // Confirm that all forms of store access are updated.
          expect(storeState().homeSkipped).toEqual(now.toISOString())
          expect(store.inspect().homeSkipped).toEqual(now)
          store.subscribe(state => expect(state.homeSkipped).toEqual(now))
        })
      })
    })

    describe('.txs', () => {
      describe('.dequeue', () => {
        it('dequeues the first transaction in the queue', () => {
          const store = createStore()

          store.txs.queue({ id: 1 })
          store.txs.queue({ id: 2 })
          store.txs.queue({ id: 3 })

          store.txs.dequeue()

          // Confirm that all forms of store access are updated.
          expect(storeState().txs.queued).toHaveLength(2)
          expect(store.inspect().txs.queued).toHaveLength(2)
          store.subscribe(state => expect(state.txs.queued).toHaveLength(2))

          expect(store.inspect().txs.queued).toEqual([
            { id: 2, offline: true },
            { id: 3, offline: true }
          ])
        })
      })

      describe('.flush', () => {
        it('sends all requests', async () => {
          
  //        const sendTxRequest = vi.fn()
          const store = createStore()
          let keys = []

          store.txs.queue({ id: '1', amount: 1, description: '1' })
          store.txs.queue({ id: '2', amount: 2, description: '2' })
          store.txs.queue({ id: '3', amount: 3, description: '3' })

          await store.txs.flush()

          expect(sendTxRequest.calls).toHaveLength(3)
          expect(sendTxRequest.calls[0][0]).toEqual({ id: '1', amount: 1, description: '1', offline: true })
          expect(sendTxRequest.calls[1][0]).toEqual({ id: '2', amount: 2, description: '2', offline: true })
          expect(sendTxRequest.calls[2][0]).toEqual({ id: '3', amount: 3, description: '3', offline: true })
        })

        describe('when a request is successful', () => {
          it('dequeues the request', async () => {
            const sendTxRequest = vi.fn()
            const store = createStore()

            store.txs.queue({ id: '1', amount: 1, description: '1' })
            store.txs.queue({ id: '2', amount: 2, description: '2' })
            store.txs.queue({ id: '3', amount: 3, description: '3' })

            expect(store.inspect().txs.queued).toHaveLength(3)
            await store.txs.flush()
            expect(store.inspect().txs.queued).toHaveLength(0)
          })
        })

        describe('when a request fails', () => {
          it('keeps the request in the queue', async () => {
            let callCount = 0

  //          async function sendTxRequest(tx) {
            sendTxRequest = async function (tx) {
                callCount++
              if (callCount > 1) throw new Error()
            }
            isTimeout = function (er) { return true }

            const store = createStore()

            store.txs.queue({ id: '1' })
            store.txs.queue({ id: '2' })
            store.txs.queue({ id: '3' })

            expect(store.inspect().txs.queued).toHaveLength(3)
            await store.txs.flush()
            expect(store.inspect().txs.queued).toHaveLength(2)

            expect(store.inspect().txs.queued[0]).toEqual({ id: '2', offline: true })
          })
        })
      })

      describe('.queue', () => {
        it('stores the transaction', () => {
          const store = createStore()
          store.txs.queue({ id: '1' })

          // Confirm that all forms of store access are updated.
          expect(storeState().txs.queued).toHaveLength(1)
          expect(store.inspect().txs.queued).toHaveLength(1)
          store.subscribe(state => expect(state.txs.queued).toHaveLength(1))

          expect(store.inspect().txs.queued[0]).toEqual({ id: '1', offline: true })
        })
      })
    })
  })
};