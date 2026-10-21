import { describe, it, expect } from 'vitest'
import { Vars, setVar, parseValue } from '../support/vars'
import { tableData } from '../support/table'
import { uidOf } from '../support/accounts'

const now = new Date(2026, 9, 15, 14, 30, 0).getTime() / 1000
const ctx = () => ({ vars: new Vars(), now })
const table = (raw: string[][]) => ({ raw: () => raw })

describe('Vars', () => {
  it('sets, has and gets', () => {
    const v = new Vars()
    v.set('account', 'Abe')
    expect(v.has('account')).toBe(true)
    expect(v.get('account')).toBe('Abe')
    expect(v.has('other')).toBe(false)
  })
  it('refuses bad names, built-in names, and unknown gets', () => {
    const v = new Vars()
    expect(() => v.set('1abc', 1)).toThrow(/Bad variable name/)
    expect(() => v.set('my-var', 1)).toThrow(/Bad variable name/)
    for (const name of ['now', 'now0', 'ymd', 'random1', 'null']) expect(() => v.set(name, 1)).toThrow(/already a magic value/)
    expect(() => v.get('nope')).toThrow(/Unknown variable/)
  })
  it('makes a random value once per key', () => {
    const v = new Vars()
    let n = 0
    expect(v.random('random1', () => 'x' + ++n)).toBe('x1')
    expect(v.random('random1', () => 'x' + ++n)).toBe('x1')
  })
})

describe('setVar', () => {
  it('evaluates times now, but leaves nicknames until the variable is used', () => {
    const c = ctx()
    setVar(c, 'start', '%now-2d')
    setVar(c, 'account', 'Abe')
    expect(c.vars.get('start')).toBe(now - 2 * 86400)
    expect(c.vars.get('account')).toBe('Abe')
  })
})

describe('parseValue', () => {
  it('reads quoted text, numbers, arrays and objects', () => {
    expect(parseValue('"Abe"')).toBe('Abe')
    expect(parseValue("'Abe'")).toBe('Abe')
    expect(parseValue('5')).toBe(5)
    expect(parseValue('-1.5')).toBe(-1.5)
    expect(parseValue('[1, 2]')).toEqual([1, 2])
    expect(parseValue('{"a": 1}')).toEqual({ a: 1 })
  })
})

describe('tableData', () => {
  const rows = [['uid', 'name'], ['Abe', 'x'], ['Bea', 'y']]
  const objs = [{ uid: uidOf('Abe'), name: 'x' }, { uid: uidOf('Bea'), name: 'y' }]

  it('values: no keys, an array of arrays', () => {
    expect(tableData(table([['a', 'b'], ['c', 'd']]), 'values', ctx())).toEqual([['a', 'b'], ['c', 'd']])
  })
  it('rows: the first row has the keys', () => {
    expect(tableData(table(rows), 'rows', ctx())).toEqual(objs)
  })
  it('rows: a header-only table is no rows', () => {
    expect(tableData(table([['uid', 'name']]), 'rows', ctx())).toEqual([])
    expect(tableData(table([]), 'rows', ctx())).toEqual([])
  })
  it('row: one record, an object', () => {
    expect(tableData(table(rows.slice(0, 2)), 'row', ctx())).toEqual(objs[0])
    expect(() => tableData(table(rows), 'row', ctx())).toThrow(/exactly one data row/)
  })
  it('rows pivoted: the first column has the keys', () => {
    expect(tableData(table([['uid', 'Abe', 'Bea'], ['name', 'x', 'y']]), 'rows pivoted', ctx())).toEqual(objs)
  })
  it('row pivoted: one record, an object', () => {
    expect(tableData(table([['uid', 'Abe'], ['name', 'x']]), 'row pivoted', ctx())).toEqual(objs[0])
    expect(() => tableData(table([['uid', 'Abe', 'Bea'], ['name', 'x', 'y']]), 'row pivoted', ctx())).toThrow(/exactly one data column/)
  })
  it('values pivoted: sideways, no keys', () => {
    expect(tableData(table([['a', 'b', 'c'], ['d', 'e', 'f']]), 'values pivoted', ctx())).toEqual([['a', 'd'], ['b', 'e'], ['c', 'f']])
  })
  it('resolves magic values in the cells, by column', () => {
    const c = ctx()
    expect(tableData(table([['uid', 'created', 'note'], ['Abe', '%now', 'Abe']]), 'row', c)).toEqual({ uid: uidOf('Abe'), created: now, note: 'Abe' })
  })
  it('can leave nicknames alone', () => {
    expect(tableData(table(rows), 'rows', ctx(), { nicknames: false })).toEqual([{ uid: 'Abe', name: 'x' }, { uid: 'Bea', name: 'y' }])
  })
})
