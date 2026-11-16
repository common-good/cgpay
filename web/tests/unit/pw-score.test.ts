import { describe, it, expect } from 'vitest'
import { pwScore, pwStrengthRatio, PW_MIN_SCORE } from '../../src/lib/pw-score'

// Mirrors cgmembers-frame cgmembers/rcredits/js/scraps.js pwScore.
// 1 point per class present (unicode, upper, lower, digit, punctuation) + length/7.

describe('pwScore', () => {
  it('scores an empty string as 0', () => {
    expect(pwScore('')).toBe(0)
  })

  it('scores 1 class + 1 char as 1 + 1/7', () => {
    expect(pwScore('a')).toBeCloseTo(1 + 1 / 7, 10)
    expect(pwScore('A')).toBeCloseTo(1 + 1 / 7, 10)
    expect(pwScore('1')).toBeCloseTo(1 + 1 / 7, 10)
    expect(pwScore('!')).toBeCloseTo(1 + 1 / 7, 10)
  })

  it('counts a bare unicode character as both the unicode and punc class (faithful to the JS source)', () => {
    // é alone: hasUnicode + hasPunc (it is not in [A-Za-z0-9]) + length/7
    expect(pwScore('é')).toBeCloseTo(2 + 1 / 7, 10)
  })

  it('counts each of the five classes once, not per occurrence', () => {
    expect(pwScore('aaaa')).toBeCloseTo(1 + 4 / 7, 10)
    expect(pwScore('aA')).toBeCloseTo(2 + 2 / 7, 10)
    expect(pwScore('aA1')).toBeCloseTo(3 + 3 / 7, 10)
    expect(pwScore('aA1!')).toBeCloseTo(4 + 4 / 7, 10)
    expect(pwScore('aA1!é')).toBeCloseTo(5 + 5 / 7, 10) // all five
  })

  it('sits just above the 5.14 minimum for 4 classes + 8 chars', () => {
    const s = pwScore('aB1!cdef') // lower + upper + digit + punc = 4, length 8 -> 4 + 8/7
    expect(s).toBeCloseTo(4 + 8 / 7, 10)
    expect(s).toBeGreaterThanOrEqual(PW_MIN_SCORE)
  })

  it('sits just below the 5.14 minimum for 4 classes + 7 chars', () => {
    const s = pwScore('aB1!cde') // 4 classes + 7 chars = 5.0 exactly
    expect(s).toBe(5)
    expect(s).toBeLessThan(PW_MIN_SCORE)
  })

  it('rejects the known weak sample (2 classes + 9 chars, used across the reset BDD)', () => {
    const s = pwScore('newpass99') // lower + digit = 2, length 9 -> 2 + 9/7
    expect(s).toBeCloseTo(2 + 9 / 7, 10)
    expect(s).toBeLessThan(PW_MIN_SCORE)
  })

  it('passes the known strong sample (4 classes + 13 chars, used across the reset BDD)', () => {
    const s = pwScore('Tulip-Rain-42') // upper + lower + digit + punc = 4, length 13
    expect(s).toBeCloseTo(4 + 13 / 7, 10)
    expect(s).toBeGreaterThanOrEqual(PW_MIN_SCORE)
  })
})

describe('pwStrengthRatio', () => {
  it('is 0 for an empty password', () => {
    expect(pwStrengthRatio('')).toBe(0)
  })

  it('is less than 1 just below the boundary', () => {
    expect(pwStrengthRatio('aB1!cde')).toBeLessThan(1)
  })

  it('clamps to 1 at or past the boundary', () => {
    expect(pwStrengthRatio('aB1!cdef')).toBe(1)
    expect(pwStrengthRatio('Tulip-Rain-42')).toBe(1)
  })
})
