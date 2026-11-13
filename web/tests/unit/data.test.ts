import { describe, it, expect, beforeEach, vi } from 'vitest'

const execute = vi.fn(async (..._args: unknown[]) => [{ insertId: 7, affectedRows: 1 }])
vi.mock('../../src/lib/server/db', () => ({ default: { execute: (...a: unknown[]) => execute(...a) } }))

const { ALLOWLIST, isForbidden, insert, update, remove, DataError } = await import('../../src/lib/server/data')

describe('data layer', () => {
  beforeEach(() => execute.mockClear())

  it('allowlist never holds a forbidden table', () => {
    for (const table of Object.keys(ALLOWLIST)) expect(isForbidden(table), table).toBe(false)
  })

  it('isForbidden flags users, tx_* and *_all', () => {
    for (const t of ['users', 'tx_hdrs', 'tx_entries_all', 'users_all']) expect(isForbidden(t), t).toBe(true)
    expect(isForbidden('reset_codes')).toBe(false)
  })

  it('refuses tables not in the allowlist', async () => {
    await expect(insert('users', { uid: 1 })).rejects.toThrow(DataError)
    await expect(insert('nope', { uid: 1 })).rejects.toThrow(/not allowed/)
    await expect(remove('constructor', { id: 1 })).rejects.toThrow(DataError)
    await expect(remove('__proto__', { id: 1 })).rejects.toThrow(DataError)
    expect(execute).not.toHaveBeenCalled()
  })

  it('refuses columns not in the entry, including identifier tricks', async () => {
    await expect(insert('reset_codes', { evil: 1 })).rejects.toThrow(/column not allowed/)
    await expect(insert('reset_codes', { 'uid`) --': 1 })).rejects.toThrow(DataError)
    await expect(update('reset_codes', { tries: 1 }, { x: 1 })).rejects.toThrow(DataError)
    await expect(update('reset_codes', { constructor: 1 }, { id: 1 })).rejects.toThrow(DataError)
    expect(execute).not.toHaveBeenCalled()
  })

  it('refuses an empty where or empty set', async () => {
    await expect(update('reset_codes', { tries: 1 }, {})).rejects.toThrow(/where/)
    await expect(update('reset_codes', {}, { id: 1 })).rejects.toThrow(DataError)
    await expect(remove('reset_codes', {})).rejects.toThrow(/where/)
    await expect(insert('reset_codes', {})).rejects.toThrow(DataError)
  })

  it('builds exact parameterized SQL', async () => {
    const res = await insert('reset_codes', { uid: 5, codeHash: 'h', expires: 99 })
    expect(res.insertId).toBe(7)
    expect(execute).toHaveBeenLastCalledWith(
      'INSERT INTO `reset_codes` (`uid`, `codeHash`, `expires`) VALUES (?, ?, ?)', [5, 'h', 99])

    await update('reset_codes', { tries: 2, usedAt: 10 }, { id: 3, uid: 5 })
    expect(execute).toHaveBeenLastCalledWith(
      'UPDATE `reset_codes` SET `tries` = ?, `usedAt` = ? WHERE `id` = ? AND `uid` = ?', [2, 10, 3, 5])

    await remove('reset_codes', { id: 3 })
    expect(execute).toHaveBeenLastCalledWith('DELETE FROM `reset_codes` WHERE `id` = ?', [3])

    await update('reset_codes', { usedAt: 10 }, { id: 3, usedAt: null })
    expect(execute).toHaveBeenLastCalledWith(
      'UPDATE `reset_codes` SET `usedAt` = ? WHERE `id` = ? AND `usedAt` IS NULL', [10, 3])
  })
})
