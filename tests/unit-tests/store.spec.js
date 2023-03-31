import { createStore } from '#store.js'
import { postRequest, isTimeout } from '#utils.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('#utils.js', () => ({ postRequest:vi.fn(), isTimeout:vi.fn() }))

const storeKey = 'cgpay'

function stored() {
  return JSON.parse(localStorage.getItem(storeKey))
}

function setupLocalStorage(data) {
  return localStorage.setItem(storeKey, JSON.stringify(data))
}

// --------------------------------------------

describe('store', () => {
  beforeEach(() => {
    setupLocalStorage(null)
    postRequest = vi.fn()
  })

  describe('when there are existing values in local storage', () => {
    it('initializes to stored values', () => {
      setupLocalStorage({ foo: { bar: 'baz' } })
      const store = createStore()
      expect(store.inspect()).toEqual({ foo: { bar: 'baz' } })
    })
  })

  describe('when there are not existing values in local storage', () => {
    it('initializes to default values', () => {
      const store = createStore()
      expect(store.inspect().sawAdd).toEqual(false)
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

        expect(store.inspect().online).toEqual(navigator.onLine)
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

  describe('.sawAdd', () => {
    it('is accessible', () => {
      const store = createStore()
      expect(store.inspect().sawAdd).toEqual(false)
    })
  })

  describe('.setSawAdd()', () => {
    it('logs the time that the user saw the home screen prompt', async () => {
      const store = createStore()

      vi.useFakeTimers()
      const now = Date.now()
      expect(store.inspect().sawAdd).toEqual(false) // Confirm initial values are set.
      store.setSawAdd()

      // Confirm that all forms of store access are updated.
      expect(store.inspect().sawAdd).toEqual(now)
      store.subscribe(state => expect(state.sawAdd).toEqual(now))
    })
  })

  describe('.txs', () => {
    describe('.deqTx', () => {
      it('dequeues the first transaction in the queue', () => {
        const store = createStore()

        store.enqTx({ id: 1 })
        store.enqTx({ id: 2 })
        store.enqTx({ id: 3 })
        store.deqTx()

        // Confirm that all forms of store access are updated.
        expect(stored().txs).toHaveLength(2)
        expect(store.inspect().txs).toHaveLength(2)
        store.subscribe(state => expect(state.txs).toHaveLength(2))

        expect(store.inspect().txs).toEqual([
          { id: 2, offline: true },
          { id: 3, offline: true }
        ])
      })
    })

    describe('.flush', () => {
      it('sends all requests', async () => {
        
        const store = createStore()

        store.enqTx({ id: '1', amount: 1, description: '1' })
        store.enqTx({ id: '2', amount: 2, description: '2' })
        store.enqTx({ id: '3', amount: 3, description: '3' })
        await store.flushTxs()

        expect(postRequest.calls).toHaveLength(3)
        expect(postRequest.calls[0][0]).toEqual({ id: '1', amount: 1, description: '1', offline: true })
        expect(postRequest.calls[1][0]).toEqual({ id: '2', amount: 2, description: '2', offline: true })
        expect(postRequest.calls[2][0]).toEqual({ id: '3', amount: 3, description: '3', offline: true })
      })

      describe('when a request is successful', () => {
        it('dequeues the request', async () => {
          const store = createStore()

          store.enqTx({ id: '1', amount: 1, description: '1' })
          store.enqTx({ id: '2', amount: 2, description: '2' })
          store.enqTx({ id: '3', amount: 3, description: '3' })

          expect(store.inspect().txs).toHaveLength(3)
          await store.flushTxs()
          expect(store.inspect().txs).toHaveLength(0)
        })
      })

      describe('when a request fails', () => {
        it('keeps the request in the queue', async () => {
          let callCount = 0

          postRequest = async function () {
            callCount++
            if (callCount > 1) throw new Error()
          }
          isTimeout = function (er) { return true }

          const store = createStore()

          store.enqTx({ id: '1' })
          store.enqTx({ id: '2' })
          store.enqTx({ id: '3' })

          expect(store.inspect().txs).toHaveLength(3)
          await store.flushTxs()
          expect(store.inspect().txs).toHaveLength(2)

          expect(store.inspect().txs[0]).toEqual({ id: '2', offline: true })
        })
      })
    })

    describe('.enqTx', () => {
      it('stores the transaction', () => {
        const store = createStore()
        store.enqTx({ id: '1' })

        // Confirm that all forms of store access are updated.
        expect(stored().txs).toHaveLength(1)
        expect(store.inspect().txs).toHaveLength(1)
        store.subscribe(state => expect(state.txs).toHaveLength(1))

        expect(store.inspect().txs[0]).toEqual({ id: '1', offline: true })
      })
    })
  })
})
