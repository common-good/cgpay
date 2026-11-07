import { describe, it, expect, beforeEach, vi } from 'vitest'

const privateEnv = { PHP_SSO_SECRET: 'test-secret' }
vi.mock('$env/dynamic/private', () => ({ get env() { return privateEnv } }))

const query = vi.fn()
const insert = vi.fn()
const update = vi.fn()
const phpLookup = vi.fn()
const phpResetDeliver = vi.fn()
const phpResetComplete = vi.fn()
vi.mock('../../src/lib/server/db', () => ({ default: { query: (...a: unknown[]) => query(...a) } }))
vi.mock('../../src/lib/server/data', () => ({ insert: (...a: unknown[]) => insert(...a), update: (...a: unknown[]) => update(...a) }))
vi.mock('../../src/lib/server/php-login', () => ({ phpLookup: (...a: unknown[]) => phpLookup(...a) }))
vi.mock('../../src/lib/server/php-reset', () => ({
  phpResetDeliver: (...a: unknown[]) => phpResetDeliver(...a),
  phpResetComplete: (...a: unknown[]) => phpResetComplete(...a)
}))

const { newCode, hashCode, requestReset, verifyReset, COOLDOWN_SECS, MAX_PER_DAY, MAX_SMS_PER_DAY, MAX_TRIES, CODE_SECS } =
  await import('../../src/lib/server/reset')

const NOW = 1_800_000_000
const rows = (...r: object[]) => query.mockResolvedValueOnce([r])
const won = { affectedRows: 1 }
const lost = { affectedRows: 0 }

beforeEach(() => {
  vi.resetAllMocks()
  privateEnv.PHP_SSO_SECRET = 'test-secret'
  phpLookup.mockResolvedValue(5)
  insert.mockResolvedValue({ insertId: 9, affectedRows: 1 })
  update.mockResolvedValue(won)
  phpResetDeliver.mockImplementation(async (_u: number, ch: string) => ch)
  phpResetComplete.mockResolvedValue('ok')
})

describe('codes', () => {
  it('makes six digits, zero-padded', () => {
    for (let i = 0; i < 200; i++) expect(newCode()).toMatch(/^[0-9]{6}$/)
  })

  it('hashes per account and code, and needs the secret', () => {
    expect(hashCode(5, '123456')).toBe(hashCode(5, '123456'))
    expect(hashCode(5, '123456')).not.toBe(hashCode(6, '123456'))
    expect(hashCode(5, '123456')).not.toBe(hashCode(5, '123457'))
    expect(hashCode(5, '123456')).not.toContain('123456')
    privateEnv.PHP_SSO_SECRET = ''
    expect(() => hashCode(5, '123456')).toThrow(/not configured/)
  })
})

describe('requestReset', () => {
  it('stores a hash (not the code) and delivers the code', async () => {
    rows()
    await requestReset('bea@example.com', 'email', NOW)
    const [table, row] = insert.mock.calls[0]
    const [uid, ch, code] = phpResetDeliver.mock.calls[0]
    expect(table).toBe('reset_codes')
    expect(row).toEqual({ uid: 5, codeHash: hashCode(5, code), expires: NOW + CODE_SECS, tries: 0, channel: 'email', created: NOW })
    expect([uid, ch]).toEqual([5, 'email'])
    expect(code).toMatch(/^[0-9]{6}$/)
    expect(JSON.stringify(row)).not.toContain(`"${code}"`)
  })

  it('does nothing for an unknown account', async () => {
    phpLookup.mockResolvedValue(null)
    await requestReset('nobody', 'email', NOW)
    expect(query).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
    expect(phpResetDeliver).not.toHaveBeenCalled()
  })

  it('waits out the cooldown', async () => {
    rows({ channel: 'email', created: NOW - COOLDOWN_SECS + 1 })
    await requestReset('x', 'email', NOW)
    expect(insert).not.toHaveBeenCalled()
    rows({ channel: 'email', created: NOW - COOLDOWN_SECS })
    await requestReset('x', 'email', NOW)
    expect(insert).toHaveBeenCalledTimes(1)
  })

  it('stops at the daily cap', async () => {
    rows(...Array.from({ length: MAX_PER_DAY }, (_, i) => ({ channel: 'email', created: NOW - 1000 - i })))
    await requestReset('x', 'email', NOW)
    expect(insert).not.toHaveBeenCalled()
  })

  it('turns sms into email past the sms cap', async () => {
    rows(...Array.from({ length: MAX_SMS_PER_DAY }, (_, i) => ({ channel: 'sms', created: NOW - 1000 - i })))
    await requestReset('x', 'sms', NOW)
    expect(insert.mock.calls[0][1].channel).toBe('email')
    expect(phpResetDeliver.mock.calls[0][1]).toBe('email')
  })

  it('sends sms while under the cap', async () => {
    rows({ channel: 'sms', created: NOW - 1000 })
    await requestReset('x', 'sms', NOW)
    expect(insert.mock.calls[0][1].channel).toBe('sms')
  })

  it('records the channel PHP actually used', async () => {
    rows()
    phpResetDeliver.mockResolvedValue('email')
    await requestReset('x', 'sms', NOW)
    expect(update).toHaveBeenCalledWith('reset_codes', { channel: 'email' }, { id: 9 })
  })

  it('leaves the row alone when PHP sent nothing', async () => {
    rows()
    phpResetDeliver.mockResolvedValue(null)
    await requestReset('x', 'email', NOW)
    expect(update).not.toHaveBeenCalled()
  })
})

describe('verifyReset', () => {
  const live = (tries = 0, code = '123456') => rows({ id: 9, codeHash: hashCode(5, code), tries })

  it('spends the code and sets the password when it is right', async () => {
    live()
    expect(await verifyReset('x', '123456', 'newpassword', NOW)).toEqual({ ok: true, uid: 5 })
    expect(update).toHaveBeenNthCalledWith(1, 'reset_codes', { tries: 1 }, { id: 9, tries: 0 })
    expect(update).toHaveBeenNthCalledWith(2, 'reset_codes', { usedAt: NOW }, { id: 9, usedAt: null })
    expect(phpResetComplete).toHaveBeenCalledWith(9, 5, 'newpassword')
  })

  it('looks only at unused, unexpired codes', async () => {
    live()
    await verifyReset('x', '123456', 'newpassword', NOW)
    const [sql, params] = query.mock.calls[0]
    expect(sql).toContain('usedAt IS NULL')
    expect(sql).toContain('expires > ?')
    expect(params).toEqual([5, NOW])
  })

  it('counts a wrong guess and sets nothing', async () => {
    live()
    expect(await verifyReset('x', '000000', 'newpassword', NOW)).toEqual({ ok: false, why: 'bad_code' })
    expect(update).toHaveBeenCalledTimes(1)
    expect(phpResetComplete).not.toHaveBeenCalled()
  })

  it('refuses once the tries are used up, even for the right code', async () => {
    live(MAX_TRIES)
    expect(await verifyReset('x', '123456', 'newpassword', NOW)).toEqual({ ok: false, why: 'bad_code' })
    expect(update).not.toHaveBeenCalled()
  })

  it('refuses when another request claimed the try first', async () => {
    live()
    update.mockResolvedValueOnce(lost)
    expect(await verifyReset('x', '123456', 'newpassword', NOW)).toEqual({ ok: false, why: 'bad_code' })
    expect(phpResetComplete).not.toHaveBeenCalled()
  })

  it('refuses when another request spent the code first', async () => {
    live()
    update.mockResolvedValueOnce(won).mockResolvedValueOnce(lost)
    expect(await verifyReset('x', '123456', 'newpassword', NOW)).toEqual({ ok: false, why: 'bad_code' })
    expect(phpResetComplete).not.toHaveBeenCalled()
  })

  it('says bad code for no live code and for an unknown account', async () => {
    rows()
    expect(await verifyReset('x', '123456', 'newpassword', NOW)).toEqual({ ok: false, why: 'bad_code' })
    phpLookup.mockResolvedValue(null)
    expect(await verifyReset('nobody', '123456', 'newpassword', NOW)).toEqual({ ok: false, why: 'bad_code' })
  })

  it('tells a refused password from an unreachable PHP', async () => {
    live()
    phpResetComplete.mockResolvedValue('rejected')
    expect(await verifyReset('x', '123456', 'newpassword', NOW)).toEqual({ ok: false, why: 'bad_password' })
    live()
    phpResetComplete.mockResolvedValue('failed')
    expect(await verifyReset('x', '123456', 'newpassword', NOW)).toEqual({ ok: false, why: 'unavailable' })
  })
})
