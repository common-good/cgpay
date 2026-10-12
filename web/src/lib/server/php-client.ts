// Server-to-server client for cgmembers-frame /cgpay-* endpoints.
// Consolidates URL resolution + shared-secret injection + fetch + JSON-shape
// checks that were duplicated across php-whoami, php-grants, php-people.
//
// Failure modes:
//   - Config missing, network error, malformed response body -> THROWN as
//     `PhpCallError`. These aren't things the caller can meaningfully decide
//     about; they're infrastructure bugs. Callers that want to survive them
//     (e.g. the layout load, which should still render as anonymous when PHP
//     is unreachable) wrap this in try/catch.
//   - HTTP 4xx/5xx from PHP -> RETURNED as `{ok:false, status, body}`.
//     The caller cares about the specific status (401 = no session,
//     403 = not sponsored, 400 = validation errors, etc.) so we surface it.

import { env } from '$env/dynamic/private'
import { phpEndpointUrl } from './env'

export type PhpResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; body: unknown }

export type PhpCallOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  query?: Record<string, string | number>
}

export class PhpCallError extends Error {
  kind: 'not_configured' | 'network' | 'bad_response'
  cause?: unknown
  constructor(kind: 'not_configured' | 'network' | 'bad_response', message: string, cause?: unknown) {
    super(message)
    this.name = 'PhpCallError'
    this.kind = kind
    this.cause = cause
  }
}

/**
 * Call a /cgpay-* server-to-server endpoint on cgmembers-frame.
 * Returns `{ok, data}` on success, `{ok:false, status, body}` on HTTP error,
 * throws `PhpCallError` on infrastructure failure (config, network, malformed body).
 */
export async function callPhp<T = unknown>(
  pathname: string,
  opts: PhpCallOptions = {}
): Promise<PhpResult<T>> {
  const secret = env.PHP_SSO_SECRET
  if (!secret) {
    // Startup validation (hooks.server.ts) catches this at boot; this branch
    // only fires if someone bypassed hooks or edited env after startup.
    throw new PhpCallError('not_configured', 'PHP_SSO_SECRET is not configured')
  }

  let url: URL
  try {
    url = new URL(phpEndpointUrl(pathname))
  } catch (e) {
    throw new PhpCallError('not_configured', 'PUBLIC_PHP_BASE_URL is not configured with a valid URL', e)
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
  } catch (e) {
    throw new PhpCallError('network', `${pathname} fetch failed`, e)
  }

  // Read the body as text first so we can distinguish "PHP returned literal null"
  // from "response body wasn't valid JSON" (per @egwynn on #166). Error responses
  // are allowed to return a non-JSON payload (e.g. a PHP fatal, an nginx error
  // page) - we still surface the status. Only OK responses must be valid JSON.
  const rawBody = await res.text().catch(() => '')
  let body: unknown = null
  let parseError: unknown = null
  if (rawBody.length > 0) {
    try {
      body = JSON.parse(rawBody)
    } catch (e) {
      parseError = e
    }
  }

  if (!res.ok) {
    return { ok: false, status: res.status, body: parseError ? rawBody : body }
  }

  if (parseError) {
    throw new PhpCallError('bad_response', `${pathname} returned non-JSON body: ${rawBody.slice(0, 200)}`, parseError)
  }
  if (body === null || typeof body !== 'object') {
    throw new PhpCallError('bad_response', `${pathname} returned unexpected body: ${rawBody.slice(0, 200)}`)
  }
  return { ok: true, data: body as T }
}
