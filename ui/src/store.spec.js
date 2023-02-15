import { createStore } from './store.js'
import { sendTxRequest, isTimeout } from '#utils.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('#utils.js', () => ({
  sendTxRequest: vi.fn(),
  isTimeout: vi.fn()
}))

// --------------------------------------------

const testKey = 'cgpay.test'
const realKey = 'cgpay.real'
const testModeKey = 'cgpay.testMode'
window.localStorage.setItem(testModeKey, JSON.stringify(true)) // do the testing in test mode

function stored() {
  return JSON.parse(window.localStorage.getItem(testKey))
}

function setupLocalStorage(data) {
  return window.localStorage.setItem(testKey, JSON.stringify(data))
}

// --------------------------------------------

/* -- Skipping these tests for Alpha testing -- */

//test.skip('store unit tests'), () => {
  describe('store', () => {
    beforeEach(() => {
      setupLocalStorage(null)
      sendTxRequest = vi.fn()
    })

    describe('when there are existing values in local storage', () => {
      it('initializes to stored values', () => {
        setupLocalStorage({ foo: { bar: 'baz' } })
        const store = createStore()
        expect(store.inspect()).toEqual({ foo: { bar: 'baz' }, testing: true })
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
        expect(store.inspect().myAccount).toEqual(null)
      })

      describe('.setAcctChoices()', () => {
        const store = createStore()
        it('is initialized as null', () => {
          expect(store.inspect().choices).toEqual(null)
        })
  
        it('sets the correct account choices', () => {
          const acctChoices = [{ acct1: 'foo' }, {acct2: 'bar'}]
          store.setAcctChoices(acctChoices)
          expect(store.inspect().choices).toEqual(acctChoices)
          expect(stored().choices).toEqual(acctChoices)
        })
      })

      describe('.isSignedIn()', () => {
        describe('when there is a linked account', () => {
          it('is true', () => {
            setupLocalStorage({
              myAccount: {name: 'bar'}
            })
            const store = createStore()
            expect(store.isSignedIn()).toEqual(true)
          })
        })

        describe('when there is not a linked business', () => {
          it('is false', () => {
            setupLocalStorage({
              myAccount: null
            })

            const store = createStore()
            expect(store.isSignedIn()).toEqual(false)
          })
        })
      })

      describe('.setMyAccount()', () => {
        it('links the given account', () => {
          const store = createStore()
          store.setMyAccount({name: 'Biz'})

          expect(stored().myAccount.name).toEqual('Biz')
          expect(store.inspect().myAccount.name).toEqual('Biz')
        })
      })
    })

    describe('.qr', () => {
      let store;
      beforeEach(() => {
        store = createStore()
      })

      it('is initialized as null', () => {
        expect(store.inspect().qr).toBeNull()
      })

      it('sets the correct qr value', () => {
        const v = '123'

        store.setQr(v)
        expect(store.inspect().qr).toEqual(v)
      })
    })

    describe('.erMsg', () => {
      let store;
      beforeEach(() => {
        store = createStore()
      })

      it('is initialized as null', () => {
        expect(store.inspect().erMsg).toBeNull()
      })

      it('sets the correct error message', () => {
        const msg = "error" 

        store.setMsg(msg)
        expect(store.inspect().erMsg).toEqual(msg)
      })
    })

    describe('.network', () => {

      describe('.online', () => {
        it('is accessible', () => {
          const store = createStore()
          expect(store.inspect().online).toEqual(null)
        })
      })

      describe('.resetNetwork()', () => {
        it('resets the network to basic online status', () => {
          const store = createStore()
          store.resetNetwork()

          expect(store.inspect().online).toEqual(window.navigator.onLine)
        })
      })

      describe('.setOnline(yesno)', () => {
        it('sets the network status to online or offline', () => {
          const store = createStore()

          store.setOnline(true)
          expect(store.inspect().online).toEqual(true)

          store.setOnline(false)
          expect(store.inspect().online).toEqual(false)
        })
      })

    })

    describe('.accts', () => {
      it('updates data for a particular account', () => {
        const card = {acct: '123'}
        const store = createStore()

        store.putAcct(card, { foo: 'bar' })
        expect(store.getAcct(card)).toEqual({ foo: 'bar' })

        store.putAcct(card, { fizz: 'buzz' })
        expect(store.getAcct(card)).toEqual({ fizz: 'buzz' })
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
            expect(store.inspect().deviceType).toEqual('Android')

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
            expect(store.inspect().deviceType).toEqual('Apple')

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
            expect(store.inspect().deviceType).toEqual('Other')

            window.navigator = originalNavigator
          })
        })
      })

      describe('.isAndroid()', () => {
        describe('when the user is on an Android device', () => {
          it('is true', () => {
            setupLocalStorage({
              device: { type: 'Android' }
            })

            const store = createStore()
            expect(store.isAndroid()).toEqual(true)
          })
        })

        describe('when the user is not on a Android device', () => {
          it('is false', () => {
            setupLocalStorage({
              device: { type: 'Apple' }
            })

            const store = createStore()
            expect(store.isAndroid()).toEqual(false)
          })
        })
      })

      describe('.isApple()', () => {
        describe('when the user is on an Apple device', () => {
          it('is true', () => {
            setupLocalStorage({
              device: { type: 'Apple' }
            })

            const store = createStore()
            expect(store.isApple()).toEqual(true)
          })
        })

        describe('when the user is not on a Apple device', () => {
          it('is false', () => {
            setupLocalStorage({
              device: { type: 'Android' }
            })

            const store = createStore()
            expect(store.isApple()).toEqual(false)
          })
        })
      })

      describe('.addableToHome()', () => {
        describe('when the user is on Safari on an Apple device and has not previously skipped the prompt', () => {
          it('is true', () => {
            setupLocalStorage({
              device: { type: 'Apple', browser: 'Safari' },
              homeSkipped: false,
            })

            const store = createStore()
            expect(store.addableToHome()).toEqual(true)
          })
        })

        describe('when the user is on Chrome on an Android device and has not previously skipped the prompt', () => {
          it('is true', () => {
            setupLocalStorage({
              device: { type: 'Android', browser: 'Chrome' },
              homeSkipped: false,
            })

            const store = createStore()
            expect(store.addableToHome()).toEqual(true)
          })
        })

        describe('when the user is not on a mobile device', () => {
          it('is false', () => {
            setupLocalStorage({
              device: { type: 'Other' },
              homeSkipped: false,
            })

            const store = createStore()
            expect(store.addableToHome()).toEqual(false)
          })
        })

        describe('when the user has previously skipped the prompt', () => {
          it('is false', () => {
            setupLocalStorage({
              device: { type: 'Apple' },
              homeSkipped: true,
            })

            const store = createStore()
            expect(store.addableToHome()).toEqual(false)
          })
        })
      })

      describe('.homeSkipped', () => {
        it('is accessible', () => {
          const store = createStore()
          expect(store.inspect().homeSkipped).toEqual(false)
        })
      })

      describe('.skipAddToHome()', () => {
        it('logs the time that the user skipped the home screen prompt', async () => {
          const store = createStore()

          vi.useFakeTimers()
          const now = Date.now()
          expect(store.inspect().homeSkipped).toEqual(false) // Confirm initial values are set.
          store.skipAddToHome()

          // Confirm that all forms of store access are updated.
          expect(store.inspect().homeSkipped).toEqual(now)
          store.subscribe(state => expect(state.homeSkipped).toEqual(now))
        })
      })
    })

    describe('.txs', () => {
      describe('.dequeue', () => {
        it('dequeues the first transaction in the queue', () => {
          const store = createStore()

          store.enqTx({ id: 1 })
          store.enqTx({ id: 2 })
          store.enqTx({ id: 3 })

          store.deqTx()

          // Confirm that all forms of store access are updated.
          expect(stored().queue).toHaveLength(2)
          expect(store.inspect().queue).toHaveLength(2)
          store.subscribe(state => expect(state.queue).toHaveLength(2))

          expect(store.inspect().queue).toEqual([
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

          store.enqTx({ id: '1', amount: 1, description: '1' })
          store.enqTx({ id: '2', amount: 2, description: '2' })
          store.enqTx({ id: '3', amount: 3, description: '3' })

          await store.flushTxs()

          expect(sendTxRequest.calls).toHaveLength(3)
          expect(sendTxRequest.calls[0][0]).toEqual({ id: '1', amount: 1, description: '1', offline: true })
          expect(sendTxRequest.calls[1][0]).toEqual({ id: '2', amount: 2, description: '2', offline: true })
          expect(sendTxRequest.calls[2][0]).toEqual({ id: '3', amount: 3, description: '3', offline: true })
        })

        describe('when a request is successful', () => {
          it('dequeues the request', async () => {
            const sendTxRequest = vi.fn()
            const store = createStore()

            store.enqTx({ id: '1', amount: 1, description: '1' })
            store.enqTx({ id: '2', amount: 2, description: '2' })
            store.enqTx({ id: '3', amount: 3, description: '3' })

            expect(store.inspect().queue).toHaveLength(3)
            await store.flushTxs()
            expect(store.inspect().queue).toHaveLength(0)
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

            store.enqTx({ id: '1' })
            store.enqTx({ id: '2' })
            store.enqTx({ id: '3' })

            expect(store.inspect().queue).toHaveLength(3)
            await store.flushTxs()
            expect(store.inspect().queue).toHaveLength(2)

            expect(store.inspect().queue[0]).toEqual({ id: '2', offline: true })
          })
        })
      })

      describe('.queue', () => {
        it('stores the transaction', () => {
          const store = createStore()
          store.enqTx({ id: '1' })

          // Confirm that all forms of store access are updated.
          expect(stored().queue).toHaveLength(1)
          expect(store.inspect().queue).toHaveLength(1)
          store.subscribe(state => expect(state.queue).toHaveLength(1))

          expect(store.inspect().queue[0]).toEqual({ id: '1', offline: true })
        })
      })
    })
  })
