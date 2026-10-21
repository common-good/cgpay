import { describe, it, expect } from 'vitest'
import {
  validateFullName, validateEmail, validatePhone, validateZip,
  validateAgreement, validateSignup
} from '../../src/lib/signup-validation'

describe('validateFullName', () => {
  it('rejects empty', () => { expect(validateFullName('')).not.toBeNull() })
  it('rejects whitespace only', () => { expect(validateFullName('   ')).not.toBeNull() })
  it('rejects single-token name', () => { expect(validateFullName('Chris')).not.toBeNull() })
  it('accepts first + last', () => { expect(validateFullName('Chris Schwab')).toBeNull() })
  it('accepts middle name', () => { expect(validateFullName('Chris A Schwab')).toBeNull() })
})

describe('validateEmail', () => {
  it('rejects empty', () => { expect(validateEmail('')).not.toBeNull() })
  it('rejects no @', () => { expect(validateEmail('chris.example.com')).not.toBeNull() })
  it('rejects no domain', () => { expect(validateEmail('chris@')).not.toBeNull() })
  it('rejects no TLD', () => { expect(validateEmail('chris@example')).not.toBeNull() })
  it('accepts well-formed', () => { expect(validateEmail('chris@example.com')).toBeNull() })
  it('accepts plus-addressing', () => { expect(validateEmail('chris+test@example.com')).toBeNull() })
})

describe('validatePhone', () => {
  it('rejects empty', () => { expect(validatePhone('')).not.toBeNull() })
  it('rejects fewer than 10 digits', () => { expect(validatePhone('555-1234')).not.toBeNull() })
  it('accepts 10 digits bare', () => { expect(validatePhone('5551234567')).toBeNull() })
  it('accepts 10 digits with formatting', () => { expect(validatePhone('(555) 123-4567')).toBeNull() })
  it('accepts international 11+', () => { expect(validatePhone('+1 555 123 4567')).toBeNull() })
})

describe('validateZip', () => {
  it('rejects empty when US', () => { expect(validateZip('')).not.toBeNull() })
  it('rejects 4-digit when US', () => { expect(validateZip('1234')).not.toBeNull() })
  it('accepts 5-digit when US', () => { expect(validateZip('02139')).toBeNull() })
  it('accepts ZIP+4 when US', () => { expect(validateZip('02139-1234')).toBeNull() })
  it('accepts arbitrary when non-US', () => { expect(validateZip('M5V 3L9', false)).toBeNull() })
  it('still rejects empty when non-US', () => { expect(validateZip('', false)).not.toBeNull() })
})

describe('validateAgreement', () => {
  it('rejects unchecked', () => { expect(validateAgreement(false)).not.toBeNull() })
  it('accepts checked', () => { expect(validateAgreement(true)).toBeNull() })
})

describe('validateSignup', () => {
  const good = {
    fullName: 'Chris Schwab',
    email: 'chris@example.com',
    phone: '5551234567',
    zip: '02139',
    agreementAccepted: true
  }

  it('clean on a well-formed input', () => {
    expect(validateSignup(good)).toEqual({})
  })

  it('collects multiple errors', () => {
    const errs = validateSignup({ fullName: '', email: 'bad', phone: '', zip: '', agreementAccepted: false })
    expect(Object.keys(errs).sort()).toEqual(['agreementAccepted', 'email', 'fullName', 'phone', 'zip'])
  })

  it('skips US zip format when outsideUS', () => {
    const errs = validateSignup({ ...good, zip: 'M5V 3L9' }, false)
    expect(errs.zip).toBeUndefined()
  })
})
