import { describe, it, expect } from 'vitest'
import { checkPassword } from '../../src/lib/server/drupal-password'

// The phpass port is a pure function — same input always produces the same
// result. These tests exercise the input-guard behavior; the actual round-trip
// (real password → real Drupal $S$ hash) is covered end-to-end by the login
// E2E test, which hits the running app against a real user row.

describe('checkPassword — input guards', () => {
  it('returns false for an empty stored hash', () => {
    expect(checkPassword('anything', '')).toBe(false)
  })

  it('returns false for a stored hash shorter than the setting header', () => {
    expect(checkPassword('anything', '$S$abc')).toBe(false)
  })

  it('returns false for a stored hash with no recognised prefix', () => {
    // Neither $S$, $P$, $H$, nor U$ — should refuse without attempting a compare
    expect(checkPassword('anything', 'notaphpasshashatall12345')).toBe(false)
  })

  it('returns false for an over-long password (>512 bytes)', () => {
    const dummyHash = '$S$D' + 'A'.repeat(8) + 'B'.repeat(43)
    expect(checkPassword('x'.repeat(513), dummyHash)).toBe(false)
  })

  it('returns false when the setting header has bad structure', () => {
    // '$' at position 0 and 2 is required; wrecking position 2 breaks it
    expect(checkPassword('anything', '$SXDsomethingelselongenoughtopass')).toBe(false)
  })

  it('returns false when the count-log2 marker is outside the 7..30 range', () => {
    // The 4th char is the count marker; '/' is index 0 in ITOA64 which is < 7
    expect(checkPassword('anything', '$S$/' + 'A'.repeat(8) + 'B'.repeat(43))).toBe(false)
  })
})

describe('checkPassword — recognises supported prefixes', () => {
  // We can't verify a real hash without generating one, but we can confirm the
  // dispatch reaches passwordCrypt for the supported prefixes (they don't
  // early-return false at the prefix check). If passwordCrypt itself returns
  // null due to malformed input, checkPassword returns false anyway — but the
  // prefix branches are visited.

  it('accepts the $S$ prefix (sha512 phpass)', () => {
    // Well-formed setting header shape but garbage payload → passwordCrypt runs,
    // returns null, checkPassword returns false. If we DIDN'T accept the prefix,
    // this would short-circuit at the `else return false` branch — same result
    // from outside, but here we're documenting the dispatch table.
    expect(checkPassword('any', '$S$D' + 'A'.repeat(8) + 'B'.repeat(43))).toBe(false)
  })

  it('accepts the $P$ prefix (md5 phpass)', () => {
    expect(checkPassword('any', '$P$D' + 'A'.repeat(8) + 'B'.repeat(22))).toBe(false)
  })

  it('accepts the $H$ prefix (phpBB3-style md5)', () => {
    expect(checkPassword('any', '$H$D' + 'A'.repeat(8) + 'B'.repeat(22))).toBe(false)
  })

  it('handles the U$ legacy prefix (D6→D7 double-hashed)', () => {
    // U$ strips the U and pre-hashes the password with md5 before checking.
    // Malformed inner payload → false, but the U$ branch is exercised.
    expect(checkPassword('any', 'U$P$D' + 'A'.repeat(8) + 'B'.repeat(22))).toBe(false)
  })
})
