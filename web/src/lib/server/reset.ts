// Password-reset codes. Node owns the reset_codes table and every limit on it; PHP only delivers
// the message and sets the password (see php-reset.ts). Callers must give the same answer whether
// or not the account exists, so nothing here throws or returns differently for an unknown account.

import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import type { RowDataPacket } from 'mysql2'
import { env } from '$env/dynamic/private'
import pool from './db'
import { insert, update } from './data'
import { phpLookup } from './php-login'
import { phpResetComplete, phpResetDeliver, type Channel } from './php-reset'

export const CODE_SECS = 10 * 60
export const MAX_TRIES = 5
export const COOLDOWN_SECS = 60
export const DAY_SECS = 24 * 60 * 60
export const MAX_PER_DAY = 10
export const MAX_SMS_PER_DAY = 3

type Row = RowDataPacket & { id: number; codeHash: string; tries: number; channel: Channel; created: number }

export const newCode = () => String(randomInt(1_000_000)).padStart(6, '0')

// Keyed with the shared secret so a leaked reset_codes row cannot be brute-forced offline (a 6-digit code has only a million values).
export function hashCode(uid: number, code: string) {
  const key = env.PHP_SSO_SECRET
  if (!key) throw new Error('PHP_SSO_SECRET is not configured')
  return createHmac('sha256', key).update(`reset:${uid}:${code}`).digest('hex')
}

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

/**
 * Make a code for an account, unless it asked too recently or too often. Gives back the
 * code (to deliver, never to store) and its row id, or null when a limit says not to send.
 * An sms request over the sms cap quietly becomes an email one.
 */
async function issueCode(uid: number, channel: Channel, now: number) {
  const [rows] = await pool.query<Row[]>('SELECT channel, created FROM reset_codes WHERE uid = ? AND created > ? ORDER BY created DESC', [uid, now - DAY_SECS])
  if (rows.length >= MAX_PER_DAY || (rows[0] && now - rows[0].created < COOLDOWN_SECS)) return null
  if (channel === 'sms' && rows.filter(r => r.channel === 'sms').length >= MAX_SMS_PER_DAY) channel = 'email'
  const code = newCode()
  const { insertId } = await insert('reset_codes', { uid, codeHash: hashCode(uid, code), expires: now + CODE_SECS, tries: 0, channel, created: now })
  return { id: insertId, code, channel }
}

/**
 * Start a reset: find the account, make a code, have PHP deliver it. Nothing comes back
 * to say whether any of that worked, on purpose.
 */
export async function requestReset(identifier: string, channel: Channel, now = Math.floor(Date.now() / 1000)) {
  const uid = await phpLookup(identifier)
  if (uid === null) return
  const issued = await issueCode(uid, channel, now)
  if (!issued) return
  const used = await phpResetDeliver(uid, issued.channel, issued.code)
  if (used && used !== issued.channel) await update('reset_codes', { channel: used }, { id: issued.id })
}

/**
 * Check a code against the account's newest unused, unexpired one. Each look costs a try,
 * and the try is claimed (tries = old value) before the comparison, so parallel guesses
 * cannot outrun the limit. A right code is spent at once; spending it is the single-use gate.
 * Gives back the row id, or null for any kind of wrong.
 */
async function spendCode(uid: number, code: string, now: number) {
  const [rows] = await pool.query<Row[]>('SELECT id, codeHash, tries FROM reset_codes WHERE uid = ? AND usedAt IS NULL AND expires > ? ORDER BY id DESC LIMIT 1', [uid, now])
  const r = rows[0]
  if (!r || r.tries >= MAX_TRIES) return null
  if ((await update('reset_codes', { tries: r.tries + 1 }, { id: r.id, tries: r.tries })).affectedRows !== 1) return null
  if (!same(hashCode(uid, code), r.codeHash)) return null
  return (await update('reset_codes', { usedAt: now }, { id: r.id, usedAt: null })).affectedRows === 1 ? r.id : null
}

/**
 * Finish a reset: the right code plus a new password. On success the caller signs the
 * member in as the returned uid. 'bad_code' covers no such account, wrong, expired and used.
 */
export async function verifyReset(identifier: string, code: string, newPassword: string, now = Math.floor(Date.now() / 1000)) {
  const uid = await phpLookup(identifier)
  const id = uid === null ? null : await spendCode(uid, code, now)
  if (uid === null || id === null) return { ok: false, why: 'bad_code' } as const
  const done = await phpResetComplete(id, uid, newPassword)
  if (done !== 'ok') return { ok: false, why: done === 'rejected' ? 'bad_password' : 'unavailable' } as const
  return { ok: true, uid } as const
}
