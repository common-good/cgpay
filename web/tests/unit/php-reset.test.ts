import { describe, it, expect, vi } from 'vitest'

const callPhp = vi.fn()
vi.mock('../../src/lib/server/php-client', () => ({ callPhp: (...a: unknown[]) => callPhp(...a), PhpCallError: class extends Error {} }))
const { phpResetComplete } = await import('../../src/lib/server/php-reset')

describe('phpResetComplete', () => {
  const refuse = (body: unknown, status = 400) => callPhp.mockResolvedValue({ ok: false, status, body })

  it("passes on PHP's reason for refusing a password", async () => {
    refuse({ errors: { newPassword: 'too easy to guess' } })
    expect(await phpResetComplete(9, 5, 'newpass99')).toEqual({ refused: 'too easy to guess' })
  })

  it('falls back to a general reason when PHP gives none', async () => {
    refuse(null)
    expect(await phpResetComplete(9, 5, 'short')).toEqual({ refused: 'That password is not acceptable.' })
  })

  it('treats any other refusal as a failure', async () => {
    refuse(null, 403)
    expect(await phpResetComplete(9, 5, 'Tulip-Rain-42')).toBe('failed')
  })
})
