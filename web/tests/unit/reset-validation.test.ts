import { describe, it, expect } from 'vitest'
import {
  validateIdentifier, validateChannel, validateCode,
  validatePassword, validateConfirmPassword, validateResetRequest
} from '../../src/lib/reset-validation'

describe('validateIdentifier', () => {
  it('rejects empty', () => { expect(validateIdentifier('')).not.toBeNull() })
  it('rejects whitespace only', () => { expect(validateIdentifier('   ')).not.toBeNull() })
  it('accepts a 254-char string', () => { expect(validateIdentifier('a'.repeat(254))).toBeNull() })
  it('rejects a 255-char string', () => { expect(validateIdentifier('a'.repeat(255))).not.toBeNull() })
  it('accepts an email', () => { expect(validateIdentifier('chris@example.com')).toBeNull() })
  it('accepts a phone-shaped string', () => { expect(validateIdentifier('+14135550102')).toBeNull() })
  it('accepts an account id', () => { expect(validateIdentifier('ZPB')).toBeNull() })
})

describe('validateChannel', () => {
  it('accepts email', () => { expect(validateChannel('email')).toBeNull() })
  it('accepts sms', () => { expect(validateChannel('sms')).toBeNull() })
  it('rejects empty', () => { expect(validateChannel('')).not.toBeNull() })
  it('rejects anything else', () => { expect(validateChannel('phone')).not.toBeNull() })
})

describe('validateCode', () => {
  it('rejects empty', () => { expect(validateCode('')).not.toBeNull() })
  it('rejects 5 digits', () => { expect(validateCode('12345')).not.toBeNull() })
  it('rejects 7 digits', () => { expect(validateCode('1234567')).not.toBeNull() })
  it('rejects a non-digit', () => { expect(validateCode('12345a')).not.toBeNull() })
  it('accepts exactly 6 digits', () => { expect(validateCode('123456')).toBeNull() })
  it('trims surrounding whitespace', () => { expect(validateCode('  123456  ')).toBeNull() })
})

describe('validatePassword', () => {
  it('rejects empty', () => { expect(validatePassword('')).not.toBeNull() })
  it('accepts a short password (server strength is the judge)', () => {
    expect(validatePassword('a')).toBeNull()
  })
  it('accepts a 128-char password', () => { expect(validatePassword('a'.repeat(128))).toBeNull() })
  it('rejects a 129-char password', () => { expect(validatePassword('a'.repeat(129))).not.toBeNull() })
})

describe('validateConfirmPassword', () => {
  it('rejects empty confirm', () => { expect(validateConfirmPassword('abc', '')).not.toBeNull() })
  it('rejects a mismatch', () => { expect(validateConfirmPassword('abc', 'abd')).not.toBeNull() })
  it('accepts an exact match', () => { expect(validateConfirmPassword('abc', 'abc')).toBeNull() })
})

describe('validateResetRequest', () => {
  it('returns no errors for a valid input', () => {
    expect(validateResetRequest({ identifier: 'chris@example.com', channel: 'email' })).toEqual({})
  })

  it('flags a bad identifier', () => {
    const errs = validateResetRequest({ identifier: '', channel: 'email' })
    expect(errs.identifier).toBeDefined()
    expect(errs.channel).toBeUndefined()
  })

  it('flags a bad channel', () => {
    const errs = validateResetRequest({ identifier: 'chris@example.com', channel: 'phone' as never })
    expect(errs.channel).toBeDefined()
    expect(errs.identifier).toBeUndefined()
  })

  it('flags both when both are bad', () => {
    const errs = validateResetRequest({ identifier: '', channel: '' as never })
    expect(errs.identifier).toBeDefined()
    expect(errs.channel).toBeDefined()
  })
})
