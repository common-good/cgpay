import { describe, it, expect } from 'vitest'
import { checkPassword } from '../../src/lib/server/drupal-password'

// The phpass port only handles the $S$ prefix — that's what every Common Good
// account uses. Company accounts have empty users.pass and can't sign in with
// any password. All other prefixes ($P$, $H$, U$) are rejected outright.

describe('checkPassword — non-$S$ input rejected', () => {
  it('returns false for an empty stored hash (company account)', () => {
    expect(checkPassword('anything', '')).toBe(false)
  })

  it('returns false for a stored hash with no recognised prefix', () => {
    expect(checkPassword('anything', 'notaphpasshashatall12345')).toBe(false)
  })

  it('rejects the legacy $P$ prefix (unused in Common Good)', () => {
    expect(checkPassword('any', '$P$D' + 'A'.repeat(8) + 'B'.repeat(22))).toBe(false)
  })

  it('rejects the legacy $H$ prefix (unused in Common Good)', () => {
    expect(checkPassword('any', '$H$D' + 'A'.repeat(8) + 'B'.repeat(22))).toBe(false)
  })

  it('rejects the legacy U$ prefix (unused in Common Good)', () => {
    expect(checkPassword('any', 'U$P$D' + 'A'.repeat(8) + 'B'.repeat(22))).toBe(false)
  })
})

describe('checkPassword — $S$ input guards', () => {
  it('returns false for a stored hash shorter than the setting header', () => {
    expect(checkPassword('anything', '$S$abc')).toBe(false)
  })

  it('returns false for an over-long password (>512 bytes)', () => {
    const dummyHash = '$S$D' + 'A'.repeat(8) + 'B'.repeat(43)
    expect(checkPassword('x'.repeat(513), dummyHash)).toBe(false)
  })

  it('returns false when the count-log2 marker is outside the 7..30 range', () => {
    // '/' is index 0 in ITOA64 which is < 7
    expect(checkPassword('anything', '$S$/' + 'A'.repeat(8) + 'B'.repeat(43))).toBe(false)
  })
})
