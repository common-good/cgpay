// JWT helpers — sign on login, verify on protected endpoints.

import jwt from 'jsonwebtoken'
import { env } from '$env/dynamic/private'

const SECRET = env.JWT_SECRET
const TTL = '8h'
const MIN_SECRET_LENGTH = 32

// Check the secret at first use rather than at import time. This way SvelteKit's
// build-time module analysis doesn't fail when the env happens to be absent — we
// still refuse to actually serve requests with a weak/missing secret.
function ensureSecret(): string {
  if (!SECRET) {
    throw new Error('JWT_SECRET is not set — refusing to sign or verify tokens.')
  }
  if (SECRET.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET is too short (${SECRET.length} chars; need >= ${MIN_SECRET_LENGTH}). ` +
      `Generate one with: openssl rand -base64 48`
    )
  }
  return SECRET
}

export type Claims = { uid: number; name: string }

export function signToken(claims: Claims): string {
  return jwt.sign(claims, ensureSecret(), { expiresIn: TTL })
}

export function verifyToken(token: string): Claims | null {
  try {
    const decoded = jwt.verify(token, ensureSecret()) as Claims
    return decoded
  } catch {
    return null
  }
}

/**
 * Pull the bearer token from an Authorization header.
 */
export function bearerFromRequest(req: Request): string | null {
  const h = req.headers.get('authorization') ?? ''
  if (!h.toLowerCase().startsWith('bearer ')) return null
  return h.slice(7).trim() || null
}
