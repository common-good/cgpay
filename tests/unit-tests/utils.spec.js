import { createStore } from '#store.js'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const storeKey = 'cgpay'
const originalNavigator = navigator

function setupLocalStorage(data) {
  return localStorage.setItem(storeKey, JSON.stringify(data))
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

  describe('.ua', () => {
    describe('when the user is on an Android mobile device', () => {
      it('is Android', () => {
        setUA('Android')
        expect(isAndroid).toEqual(true)
        expect(isApple()).toEqual(false)
      })
    })

    describe('when the user is on an Apple mobile device', () => {
      it('is Apple', () => {
        setUA('Apple')
        expect(isAndroid).toEqual(false)
        expect(isApple()).toEqual(true)
      })
    })

    describe('when the user is not on a mobile device', () => {
      it('is Other', () => {
        setUA('Other')
        expect(!isApple() && !isAndroid()).toEqual(true)
      })
    })

    describe('.addableToHome()', () => {
      describe('when the user is on Safari on an Apple device and has not previously seen the prompt', () => {
        it('is true', () => {
          setUA('Apple')
          setupLocalStorage({ sawAdd:false })
          expect(addableToHome()).toEqual(true)
        })
      })

      describe('when the user is on Chrome on an Android device and has not previously seen the prompt', () => {
        it('is true', () => {
          setUA('Android')
          setupLocalStorage({ sawAdd:false })
          expect(addableToHome()).toEqual(true)
        })
      })

      describe('when the user is not on a mobile device', () => {
        it('is false', () => {
          setUA('Other')
          setupLocalStorage({ sawAdd:false })
          expect(addableToHome()).toEqual(false)
        })
      })

      describe('when the user has previously seen the prompt', () => {
        it('is false', () => {
          setUA('Apple')
          setupLocalStorage({ sawAdd:true })
          expect(addableToHome()).toEqual(false)
        })
      })
    })
  })
})
