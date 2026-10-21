import { describe, it, expect } from 'vitest'
import { rowProblems } from '../support/compare'
import { stepKey, stepOrderProblems } from '../support/step-order'
import { Vars } from '../support/vars'
import { uidOf } from '../support/accounts'

const ctx = { vars: new Vars(), now: 1_800_000_000 }

describe('rowProblems', () => {
  it('matches when every wanted value is there, ignoring other keys', () => {
    expect(rowProblems([{ a: 1, b: 2 }], [{ a: '1' }], ctx)).toEqual([])
  })
  it('includes the wanted rows in any order, and the app may have more', () => {
    expect(rowProblems([{ a: 1 }, { a: 2 }, { a: 3 }], [{ a: 3 }, { a: 1 }], ctx)).toEqual([])
    expect(rowProblems([{ a: 1 }], [], ctx)).toEqual([])
  })
  it('uses each row of the app for only one wanted row', () => {
    expect(rowProblems([{ a: 1 }], [{ a: 1 }, { a: 1 }], ctx)).toHaveLength(1)
    expect(rowProblems([{ a: 1 }, { a: 1 }], [{ a: 1 }, { a: 1 }], ctx)).toEqual([])
  })
  it('compares numbers as numbers', () => {
    expect(rowProblems([{ amt: '1000.00' }], [{ amt: 1000 }], ctx)).toEqual([])
    expect(rowProblems([{ amt: 5 }], [{ amt: '6' }], ctx)).toHaveLength(1)
  })
  it('lets ? be anything and ! mean not', () => {
    expect(rowProblems([{ a: 'x' }], [{ a: '?' }], ctx)).toEqual([])
    expect(rowProblems([{ a: 'x' }], [{ a: '!y' }], ctx)).toEqual([])
    expect(rowProblems([{ a: 'x' }], [{ a: '!x' }], ctx)).toHaveLength(1)
    expect(rowProblems([{ uid: uidOf('Abe') }], [{ uid: '!Bea' }], ctx)).toEqual([])
  })
  it('matches an empty value to null or empty', () => {
    expect(rowProblems([{ a: null }], [{ a: '' }], ctx)).toEqual([])
    expect(rowProblems([{ a: '' }], [{ a: '' }], ctx)).toEqual([])
    expect(rowProblems([{ a: 'x' }], [{ a: '' }], ctx)).toHaveLength(1)
  })
  it('lets time fields differ by a few seconds', () => {
    expect(rowProblems([{ created: 1000 }], [{ created: 1002 }], ctx)).toEqual([])
    expect(rowProblems([{ created: 1000 }], [{ created: 1010 }], ctx)).toHaveLength(1)
    expect(rowProblems([{ ckDate: 1000 }], [{ ckDate: 1002 }], ctx)).toEqual([])
    expect(rowProblems([{ amount: 1000 }], [{ amount: 1002 }], ctx)).toHaveLength(1)
  })
  it('reports a wanted row when the app has none left', () => {
    expect(rowProblems([], [{ a: 1 }], ctx)[0]).toMatch(/no row matches wanted row 1 \(the app has no rows left\)/)
  })
  it('names the wanted row and the field that differs in the closest row', () => {
    expect(rowProblems([{ a: 1 }, { a: 2 }], [{ a: 1 }, { a: 3 }], ctx)).toEqual(['no row matches wanted row 2 (closest: "a" is 2, wanted 3)'])
  })
})

describe('stepKey', () => {
  it('drops arguments and punctuation', () => {
    expect(stepKey('see {string}')).toBe('see')
    expect(stepKey('see not {string}')).toBe('see not')
    expect(stepKey('input {string}: {string}')).toBe('input')
    expect(stepKey('these {string} rows:')).toBe('these rows')
    expect(stepKey('var {string} is {value}')).toBe('var is')
    expect(stepKey('on PHP page {string}')).toBe('on php page')
  })
})

describe('stepOrderProblems', () => {
  const good = [
    "GWhen('click {string}', async () => {})",
    "GWhen('input {string}: {string}', async () => {})",
    '',
    "Then('see {string}', async () => {})",
    "Then('see not {string}', async () => {})"
  ].join('\n')

  it('accepts steps in order with one blank line between the sections', () => {
    expect(stepOrderProblems(good)).toEqual([])
  })
  it('flags a step out of order', () => {
    const bad = good.replace("GWhen('click", "GWhen('zoom").replace("GWhen('input", "GWhen('click")
    expect(stepOrderProblems(bad)[0]).toMatch(/should come before/)
  })
  it('flags a blank line inside a section', () => {
    expect(stepOrderProblems(good.replace("\nGWhen('input", "\n\nGWhen('input"))[0]).toMatch(/next line/)
  })
  it('flags a missing or doubled blank line between the sections', () => {
    expect(stepOrderProblems(good.replace('\n\n', '\n'))[0]).toMatch(/exactly one blank line/)
    expect(stepOrderProblems(good.replace('\n\n', '\n\n\n'))[0]).toMatch(/exactly one blank line/)
  })
  it('flags a GWhen step after the Then steps', () => {
    expect(stepOrderProblems(good + "\nGWhen('zoom', async () => {})")[0]).toMatch(/after the Then steps/)
  })
})
