// Server-to-server client for cgmembers-frame /cgpay-* endpoints.
// Consolidates URL resolution + shared-secret injection + fetch + JSON-shape
// checks that were duplicated across php-whoami, php-grants, php-people.
//
// Callers pattern-match on the discriminated result rather than catching
// exceptions - keeps failure modes explicit.

import { env } from '$env/dynamic/private'

export type PhpResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: 'not_configured' }
  | { ok: false; kind: 'network'; error: unknown }
  | { ok: false; kind: 'http'; status: number; body: unknown }
  | { ok: false; kind: 'bad_response'; body: unknown }

export type PhpFailureKind = 'not_configured' | 'network' | 'http' | 'bad_response'

/**
 * Human-readable label for a failure kind - used when a caller wants to
 * include the reason in an Error message.
 */
export function describeFailure(kind: PhpFailureKind): string {
  switch (kind) {
    case 'not_configured': return 'not configured'
    case 'network': return 'network error'
    case 'http': return 'HTTP error'
    case 'bad_response': return 'malformed response'
  }
}

export type PhpCallOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  query?: Record<string, string | number>
  /** Which env var to use for the base URL. Defaults to PHP_SSO_URL. */
  baseUrlEnv?: 'PHP_SSO_URL' | 'PHP_GRANTS_URL'
}

/**
 * Call a /cgpay-* server-to-server endpoint on cgmembers-frame.
 * Returns a discriminated PhpResult so the caller can distinguish
 * "config missing" from "network error" from "HTTP 4xx/5xx" from
 * "response body malformed".
 */
export async function callPhp<T = unknown>(
  pathname: string,
  opts: PhpCallOptions = {}
): Promise<PhpResult<T>> {
  const baseEnvName = opts.baseUrlEnv ?? 'PHP_SSO_URL'
  const baseUrl = env[baseEnvName]
  const secret = env.PHP_SSO_SECRET
  if (!baseUrl || !secret) {
    console.warn(`[php-client] ${baseEnvName} or PHP_SSO_SECRET not configured; skipping ${pathname}`)
    return { ok: false, kind: 'not_configured' }
  }

  let url: URL
  try {
    url = new URL(baseUrl)
    url.pathname = pathname
  } catch (e) {
    console.warn(`[php-client] ${baseEnvName} malformed:`, e)
    return { ok: false, kind: 'not_configured' }
  }

  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      url.searchParams.set(k, String(v))
    }
  }

  const method = opts.method ?? (opts.body !== undefined ? 'POST' : 'GET')
  const headers: Record<string, string> = { 'x-cg-internal-token': secret }
  if (method !== 'GET' && opts.body !== undefined) {
    headers['content-type'] = 'application/json'
  }

  let res: Response
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
    })
  } catch (error) {
    console.error(`[php-client] ${pathname} network error:`, error)
    return { ok: false, kind: 'network', error }
  }

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    return { ok: false, kind: 'http', status: res.status, body }
  }

  if (body === null || typeof body !== 'object') {
    console.warn(`[php-client] ${pathname} returned unexpected body:`, body)
    return { ok: false, kind: 'bad_response', body }
  }

  return { ok: true, data: body as T }
}
