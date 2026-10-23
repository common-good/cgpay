import { describe, it, expect } from 'vitest'
import { resolve, isBuiltInName } from '../support/magic'
import { Vars } from '../support/vars'
import { uidOf } from '../support/accounts'

// The test config pins TZ to America/New_York, so these local dates are the same wherever the tests run.
const secs = (y: number, m: number, d: number, h = 0, n = 0) => new Date(y, m - 1, d, h, n, 0).getTime() / 1000
const now = secs(2026, 10, 15, 14, 30)
const ctx = () => ({ vars: new Vars(), now })
const r = (v: unknown, field?: string, c = ctx(), opts = {}) => resolve(v, field, c, opts)

describe('time values', () => {
  it('%now is the scenario time and %now0 is the start of that day', () => {
    expect(r('%now')).toBe(now)
    expect(r('%now0')).toBe(secs(2026, 10, 15))
  })
  it('takes offsets in n, h, d, w, m and y', () => {
    expect(r('%now-2d')).toBe(secs(2026, 10, 13, 14, 30))
    expect(r('%now+3h')).toBe(secs(2026, 10, 15, 17, 30))
    expect(r('%now-30n')).toBe(secs(2026, 10, 15, 14, 0))
    expect(r('%now0-1w')).toBe(secs(2026, 10, 8))
    expect(r('%now-1m')).toBe(secs(2026, 9, 15, 14, 30))
    expect(r('%now+1y')).toBe(secs(2027, 10, 15, 14, 30))
  })
  it('knows yesterday, tomorrow, last month and this month', () => {
    expect(r('%yesterday')).toBe(secs(2026, 10, 14, 14, 30))
    expect(r('%tomorrow0')).toBe(secs(2026, 10, 16))
    expect(r('%lastm')).toBe(secs(2026, 9, 1))
    expect(r('%thism')).toBe(secs(2026, 10, 1))
    expect(r('%yearAgo')).toBe(secs(2025, 10, 15, 14, 30))
    expect(r('%monthAgo')).toBe(secs(2026, 9, 15, 14, 30))
  })
  it('formats dates with the named formats, offsets included', () => {
    expect(r('%ymd')).toBe('2026-10-15')
    expect(r('%dmy-3d')).toBe('12Oct2026')
    expect(r('%dmqy')).toBe("15Oct'26")
    expect(r('%dm')).toBe('15-Oct')
    expect(r('%mdy')).toBe('10/15/26')
    expect(r('%mdY')).toBe('10/15/2026')
    expect(r('%md')).toBe('Oct 15')
    expect(r('%mY')).toBe('Oct 2026')
    expect(r('%todayn')).toBe('20261015')
    expect(r('%lastmy')).toBe('Sep2026')
    expect(r('%lastmd')).toBe('Sep 01')
    expect(r('%lastmdy')).toBe('09/01/26')
  })
  it('works inside longer text', () => {
    expect(r('Paid on %ymd by %ymd-1d')).toBe('Paid on 2026-10-15 by 2026-10-14')
  })
})

describe('other magic values', () => {
  it('has a percent sign, a space, null and the booleans', () => {
    expect(r('%%')).toBe('%')
    expect(r('50%%')).toBe('50%')
    expect(r('a%_b')).toBe('a b')
    expect(r('%null')).toBeNull()
    expect(r('%true')).toBe(true)
    expect(r('%false')).toBe(false)
    expect(() => r('is %null')).toThrow(/whole value/)
  })
  it('leaves a percent sign alone unless a word follows it', () => {
    expect(r('100%')).toBe('100%')
    expect(r('50% off')).toBe('50% off')
  })
  it('rejects unknown % words', () => {
    expect(() => r('%tody')).toThrow(/Unknown magic value %tody/)
    expect(() => r('Paid %tody')).toThrow(/Unknown magic value/)
  })
  it('keeps %random1 to %random3 and %number1 to %number5 the same for the scenario', () => {
    const c = ctx()
    expect(r('%random3', undefined, c)).toBe(r('%random3', undefined, c))
    expect(r('%number1', undefined, c)).toBe(r('%number1', undefined, c))
    expect(r('%random', undefined, c)).not.toBe(r('%random', undefined, c))
    expect(r('%number1')).toMatch(/^\+1[2-9]\d{9}$/)
  })
  it('knows which names are built in', () => {
    for (const name of ['now', 'now0', 'ymd', 'dmy0', 'random1', 'null']) expect(isBuiltInName(name)).toBe(true)
    expect(isBuiltInName('account')).toBe(false)
  })
})

describe('account nicknames', () => {
  it('become what the field needs', () => {
    expect(r('Bea', 'uid')).toBe(uidOf('Bea'))
    expect(r('Abe', 'uid1')).toBe(uidOf('Abe'))
    expect(r('Bea', 'identifier')).toBe('NEWZPB')
    expect(r('Bea', 'fullName')).toBe('Bea Two')
  })
  it('stay as they are in any other field, or when turned off', () => {
    expect(r('Bea', 'description')).toBe('Bea')
    expect(r('Bea')).toBe('Bea')
    expect(r('Bea', 'uid', ctx(), { nicknames: false })).toBe('Bea')
  })
})

describe('variables', () => {
  it('replace a whole value with its real type, and nicknames still apply afterward', () => {
    const c = ctx()
    c.vars.set('account', 'Abe')
    c.vars.set('ids', [1, 2, 3])
    expect(r('%account', 'uid', c)).toBe(uidOf('Abe'))
    expect(r('%ids', 'x', c)).toEqual([1, 2, 3])
  })
  it('are text inside longer values, and cannot hold arrays there', () => {
    const c = ctx()
    c.vars.set('account', 'Abe')
    c.vars.set('ids', [1, 2])
    expect(r('hi %account!', 'x', c)).toBe('hi Abe!')
    expect(() => r('ids: %ids', 'x', c)).toThrow(/not text or a number/)
  })
  it('keep a following -3d as plain text unless they are times', () => {
    const c = ctx()
    c.vars.set('account', 'Abe')
    expect(r('%account-3d', 'x', c)).toBe('Abe-3d')
  })
  it('fail when unknown', () => {
    expect(() => r('%nobody')).toThrow(/Unknown magic value %nobody/)
  })
})

describe('arrays and objects', () => {
  it('are parsed from JSON text and resolved inside', () => {
    expect(r('[1, 2]')).toEqual([1, 2])
    expect(r('{"uid": "Abe"}')).toEqual({ uid: uidOf('Abe') })
    expect(r(['Abe', 'Bea'], 'uid')).toEqual([uidOf('Abe'), uidOf('Bea')])
  })
  it('leave text that only looks like one', () => {
    expect(r('[draft]')).toBe('[draft]')
  })
  it('pass numbers and booleans through', () => {
    expect(r(5)).toBe(5)
    expect(r(true)).toBe(true)
  })
})
