// Server-to-server calls to the two slim PHP endpoints behind the password reset.
// Node owns the codes and limits; PHP only sends the message and sets the password.

import { callPhp, PhpCallError } from './php-client'

export type Channel = 'email' | 'sms'

/** Send the code. PHP may fall back from sms to email, so it says which channel it used (null if it sent nothing). */
export async function phpResetDeliver(uid: number, channel: Channel, code: string): Promise<Channel | null> {
  try {
    const r = await callPhp<{ channel?: unknown }>('/cgpay/reset-deliver', { body: { uid, channel, code } })
    if (!r.ok) return null
    return r.data.channel === 'sms' || r.data.channel === 'email' ? r.data.channel : null
  } catch (e) {
    if (!(e instanceof PhpCallError)) throw e
    console.error('[reset] deliver failed:', e.message)
    return null
  }
}

/** Set the new password for a code node has just verified. { refused } means PHP refused the password itself (too weak, say), with its reason. */
export async function phpResetComplete(resetId: number, uid: number, newPassword: string): Promise<'ok' | 'failed' | { refused: string }> {
  try {
    const r = await callPhp('/cgpay/reset-complete', { body: { resetId, uid, newPassword } })
    if (r.ok) return 'ok'
    const why = (r.body as { errors?: { newPassword?: unknown } } | null)?.errors?.newPassword
    return r.status === 400 ? { refused: typeof why === 'string' ? why : 'That password is not acceptable.' } : 'failed'
  } catch (e) {
    if (!(e instanceof PhpCallError)) throw e
    console.error('[reset] complete failed:', e.message)
    return 'failed'
  }
}
