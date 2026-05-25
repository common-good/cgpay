// JWT helpers — sign on login, verify on protected endpoints.

import jwt from 'jsonwebtoken'
import { env } from '$env/dynamic/private'

const SECRET = env.JWT_SECRET
const TTL = '8h'

if (!SECRET) {
  // Surface this loudly at boot rather than at first request.
  throw new Error('JWT_SECRET is not set — refusing to start without it.')
}

export type Claims = { uid: number; name: string }

export function signToken(claims: Claims): string {
  return jwt.sign(claims, SECRET as string, { expiresIn: TTL })
}

export function verifyToken(token: string): Claims | null {
  try {
    const decoded = jwt.verify(token, SECRET as string) as Claims
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
