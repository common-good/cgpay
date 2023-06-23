import { createStore } from '#store.js'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import c from '#constants.js'
import u from '#utils.js'

const originalNavigator = navigator

function setupLocalStorage(data) {
  return localStorage.setItem(c.storeKey, JSON.stringify(data))
}

function setUA(agent) {
  navigator = { userAgent:
    agent == 'Android' ? 'Mozilla/5.0 (Linux; Android 12; SM-S906N Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/80.0.3987.119 Mobile Safari/537.36'
    : (agent == 'Apple' ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1'
    : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36' )
  }
}

describe('utils', () => {
  beforeEach(() => {
    setupLocalStorage(null)
    navigator = originalNavigator
  })

  describe('makeQrUrl', () => {
    it('returns a QR URL for the given account ID', () => {
      expect(u.makeQrUrl('K6VMDCA12345a')).toEqual('HTTP://6VM.RC4.ME/KDCA12345a')
    })
  })

  describe('findByValue', () => {
    it('returns the correct index to an object with the given keyed value', () => {
      expect(u.findByValue({ a:{ one:1, two:-1 }, b:{ one:2, two:-1 }, c:{ one:2, two:-2, three:3 } }, { one:2, two:-2 })).toEqual('c')
    })
  })

  describe('.parseObjString', () => {
    it('parses arrays and objects correctly', () => {
      expect(u.parseObjString(`[]`)).toStrictEqual([])
      expect(u.parseObjString(`[1, 'two']`)).toStrictEqual([1, 'two'])
      expect(u.parseObjString(`[1, "two"]`)).toStrictEqual([1, 'two'])
      expect(u.parseObjString(`[1, [2, 'two']]`)).toStrictEqual([1, [2, 'two']])

      expect(u.parseObjString(`{}`)).toStrictEqual({})
      expect(u.parseObjString(`{a:1, b:'two', 'c d':'three'}`)).toStrictEqual({a:1, b:'two', 'c d':'three'})

      const arg = `{a:1, b:[3, 'c', "d", {e:'f', 'g':{h:9, i:'ten', "j k":['11', 12]}}]}`
      const want = {a:1, b:[3, 'c', 'd', {e:'f',  g :{h:9, i:'ten', 'j k':['11', 12]}}]}
      expect(u.parseObjString(arg)).toStrictEqual(want)
    })
  })

  describe('.ua', () => {
    describe('when the user is on an Android mobile device', () => {
      it('is Android', () => {
        setUA('Android')
        expect(u.isAndroid()).toEqual(true)
        expect(isApple()).toEqual(false)
      })
    })

    describe('when the user is on an Apple mobile device', () => {
      it('is Apple', () => {
        setUA('Apple')
        expect(u.isAndroid()).toEqual(false)
        expect(u.isApple()).toEqual(true)
      })
    })

    describe('when the user is not on a mobile device', () => {
      it('is Other', () => {
        setUA('Other')
        expect(!u.isApple() && !u.isAndroid()).toEqual(true)
      })
    })

    describe('.addableToHome()', () => {
      describe('when the user is on Safari on an Apple device and has not previously seen the prompt', () => {
        it('is true', () => {
          setUA('Apple')
          setupLocalStorage({ sawAdd:false })
          expect(u.addableToHome()).toEqual(true)
        })
      })

      describe('when the user is on Chrome on an Android device and has not previously seen the prompt', () => {
        it('is true', () => {
          setUA('Android')
          setupLocalStorage({ sawAdd:false })
          expect(u.addableToHome()).toEqual(true)
        })
      })

      describe('when the user is not on a mobile device', () => {
        it('is false', () => {
          setUA('Other')
          setupLocalStorage({ sawAdd:false })
          expect(u.addableToHome()).toEqual(false)
        })
      })

      describe('when the user has previously seen the prompt', () => {
        it('is false', () => {
          setUA('Apple')
          setupLocalStorage({ sawAdd:true })
          expect(u.addableToHome()).toEqual(false)
        })
      })
    })
  })

})
