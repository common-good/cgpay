// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { readSignupSession, writeSignupSession, clearSignupSession } from '../../src/lib/signup-session'

// jsdom provides a sessionStorage implementation; vitest's default `node` environment doesn't.
describe('signupSession', () => {
  beforeEach(() => sessionStorage.clear())

  it('returns null when nothing stored', () => {
    expect(readSignupSession()).toBeNull()
  })

  it('round-trips a well-formed value', () => {
    writeSignupSession({ uid: 42, qid: 'A.ZZF' })
    expect(readSignupSession()).toEqual({ uid: 42, qid: 'A.ZZF' })
  })

  it('round-trips a value with a code', () => {
    writeSignupSession({ uid: 42, qid: 'A.ZZF', code: 'tree' })
    expect(readSignupSession()).toEqual({ uid: 42, qid: 'A.ZZF', code: 'tree' })
  })

  it('returns null when stored value is not JSON', () => {
    sessionStorage.setItem('cgpay.signup', 'not json')
    expect(readSignupSession()).toBeNull()
  })

  it('returns null when stored value is JSON but shape is wrong', () => {
    sessionStorage.setItem('cgpay.signup', JSON.stringify({ uid: 'not a number', qid: 'A.ZZF' }))
    expect(readSignupSession()).toBeNull()
  })

  it('returns null when uid or qid missing', () => {
    sessionStorage.setItem('cgpay.signup', JSON.stringify({ uid: 42 }))
    expect(readSignupSession()).toBeNull()
    sessionStorage.setItem('cgpay.signup', JSON.stringify({ qid: 'A.ZZF' }))
    expect(readSignupSession()).toBeNull()
  })

  it('clear removes the value', () => {
    writeSignupSession({ uid: 42, qid: 'A.ZZF' })
    clearSignupSession()
    expect(readSignupSession()).toBeNull()
  })
})
