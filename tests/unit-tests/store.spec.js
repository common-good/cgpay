import { createStore } from '#store.js'
import { postRequest, isTimeout } from '#utils.js'
import c from '#constants.js'
import cache0 from '#cache.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The real utils.js pulls in qrcode/router/websocket deps that hang the test runner, and
// store.js's proxy already falls back to utils0.js for the pure helpers. So we only need to
// supply now() (utils0 has now0, not now) and stub the network-facing calls.
vi.mock('#utils.js', () => {
  const now = () => Math.floor(Date.now() / 1000)
  return { default:{ now }, now, postRequest:vi.fn(), isTimeout:vi.fn() }
})

// createStore() shallow-copies cache0, so its array/object fields (txs, accts, etc.) are shared
// by reference and accumulate mutations across createStore() calls. Snapshot the pristine
// defaults once and restore before each test so state can't leak between tests.
const cache0Defaults = JSON.parse(JSON.stringify(cache0))

function stored() {
  return JSON.parse(localStorage.getItem(c.storeKey))
}

function setupLocalStorage(data) {
  return localStorage.setItem(c.storeKey, JSON.stringify(data))
}

// --------------------------------------------

describe('store', () => {
  beforeEach(() => {
    Object.assign(cache0, JSON.parse(JSON.stringify(cache0Defaults)))
    localStorage.clear()
    sessionStorage.clear()
    setupLocalStorage(null)
    vi.clearAllMocks()
  })

  describe('when there are existing values in local storage', () => {
    it('initializes to stored values', () => {
      setupLocalStorage({ foo: { bar: 'baz' } })
      const st = createStore()
      expect(st.inspect()).toMatchObject({ foo: { bar: 'baz' } })
    })
  })

  describe('when there are not existing values in local storage', () => {
    it('initializes to default values', () => {
      const st = createStore()
      expect(st.inspect().sawAdd).toEqual(null)
    })
  })


  describe('.me', () => {
    it('is accessible', () => {
      const st = createStore()
      expect(st.inspect().me).toEqual(null)
    })

    describe('.setAcctChoices()', () => {
      const st = createStore()
      it('is initialized as null', () => {
        expect(st.inspect().choices).toEqual(null)
      })

      it('sets the correct account choices', () => {
        const acctChoices = [{ acct1: 'foo' }, {acct2: 'bar'}]
        st.setAcctChoices(acctChoices)
        expect(st.inspect().choices).toEqual(acctChoices)
        expect(stored().choices).toEqual(acctChoices)
      })
    })

    describe('.linked()', () => {
      describe('when there is a linked account', () => {
        it('is true', () => {
          setupLocalStorage({
            me: {name: 'bar'}
          })
          const st = createStore()
          expect(st.linked()).toEqual(true)
        })
      })

      describe('when there is not a linked business', () => {
        it('is false', () => {
          setupLocalStorage({
            me: null
          })

          const st = createStore()
          expect(st.linked()).toEqual(false)
        })
      })
    })

    describe('.setMe()', () => {
      it('links the given account', () => {
        const st = createStore()
        st.setMe({name: 'Biz'})

        expect(stored().me.name).toEqual('Biz')
        expect(st.inspect().me.name).toEqual('Biz')
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
        const st = createStore()
        expect(st.inspect().online).toEqual(null)
      })
    })

    describe('.resetNetwork()', () => {
      it('resets the network to basic online status', () => {
        const st = createStore()
        st.resetNetwork()

        expect(st.inspect().online).toEqual(navigator.onLine)
      })
    })

    describe('.setOnline(yesno)', () => {
      it('sets the network status to online or offline', () => {
        const st = createStore()

        st.setOnline(true)
        expect(st.inspect().online).toEqual(true)

        st.setOnline(false)
        expect(st.inspect().online).toEqual(false)
      })
    })

  })

  describe('.accts', () => {
    it('updates data for a particular account', () => {
      const card = {acct: '123'}
      const st = createStore()

      st.putAcct(card, { foo: 'bar' })
      expect(st.getAcct(card)).toEqual({ foo: 'bar' })

      st.putAcct(card, { fizz: 'buzz' })
      expect(st.getAcct(card)).toEqual({ fizz: 'buzz' })
    })
  })

  describe('.sawAdd', () => {
    it('is accessible', () => {
      const st = createStore()
      expect(st.inspect().sawAdd).toEqual(null)
    })
  })

  describe('.setSawAdd()', () => {
    it('logs the time that the user saw the home screen prompt', async () => {
      const st = createStore()

      vi.useFakeTimers()
      const now = Math.floor(Date.now() / 1000)
      expect(st.inspect().sawAdd).toEqual(null) // Confirm initial values are set.
      st.setSawAdd()

      // Confirm that all forms of store access are updated.
      expect(st.inspect().sawAdd).toEqual(now)
      st.subscribe(state => expect(state.sawAdd).toEqual(now))
    })
  })

  describe('.txs', () => {
    describe('.deqTx', () => {
      it('dequeues the first transaction in the queue', () => {
        const st = createStore()

        st.enqTx({ id: 1 })
        st.enqTx({ id: 2 })
        st.enqTx({ id: 3 })
        st.deqTx()

        // Confirm that all forms of store access are updated.
        expect(stored().txs).toHaveLength(2)
        expect(st.inspect().txs).toHaveLength(2)
        st.subscribe(state => expect(state.txs).toHaveLength(2))

        expect(st.inspect().txs).toEqual([
          { id: 2, offline: true },
          { id: 3, offline: true }
        ])
      })
    })

    describe('.flush', () => {
      it('sends all requests', async () => {
        
        const st = createStore()

        st.enqTx({ id: '1', amount: 1, description: '1' })
        st.enqTx({ id: '2', amount: 2, description: '2' })
        st.enqTx({ id: '3', amount: 3, description: '3' })
        await st.flushTxs()

        expect(postRequest.calls).toHaveLength(3)
        expect(postRequest.calls[0][0]).toEqual({ id: '1', amount: 1, description: '1', offline: true })
        expect(postRequest.calls[1][0]).toEqual({ id: '2', amount: 2, description: '2', offline: true })
        expect(postRequest.calls[2][0]).toEqual({ id: '3', amount: 3, description: '3', offline: true })
      })

      describe('when a request is successful', () => {
        it('dequeues the request', async () => {
          const st = createStore()

          st.enqTx({ id: '1', amount: 1, description: '1' })
          st.enqTx({ id: '2', amount: 2, description: '2' })
          st.enqTx({ id: '3', amount: 3, description: '3' })

          expect(st.inspect().txs).toHaveLength(3)
          await st.flushTxs()
          expect(st.inspect().txs).toHaveLength(0)
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

          const st = createStore()

          st.enqTx({ id: '1' })
          st.enqTx({ id: '2' })
          st.enqTx({ id: '3' })

          expect(st.inspect().txs).toHaveLength(3)
          await st.flushTxs()
          expect(st.inspect().txs).toHaveLength(2)

          expect(st.inspect().txs[0]).toEqual({ id: '2', offline: true })
        })
      })
    })

    describe('.enqTx', () => {
      it('stores the transaction', () => {
        const st = createStore()
        st.enqTx({ id: '1' })

        // Confirm that all forms of store access are updated.
        expect(stored().txs).toHaveLength(1)
        expect(st.inspect().txs).toHaveLength(1)
        st.subscribe(state => expect(state.txs).toHaveLength(1))

        expect(st.inspect().txs[0]).toEqual({ id: '1', offline: true })
      })
    })
  })
})
