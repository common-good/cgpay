// Centralised env-var access + derivations.
//
// Previously each caller read its own env vars with ad-hoc "render anonymous
// / skip handoff" fallbacks when values were missing. That turned configuration
// errors into silent "login looks successful, then every page bounces back to
// /login" behaviour. Now:
//
//   - `assertRequiredEnv` runs once at startup from hooks.server.ts and throws
//     with a clear list of what's missing, so misconfigured environments fail
//     at boot instead of at the first user request.
//   - `phpSsoUrl` / `phpGrantsUrl` / `phpCookieDomain` derive from
//     `PUBLIC_PHP_BASE_URL`, so there's one source of truth for which PHP host
//     an environment points at.
//
// See cgpay #178.

import { env as privateEnv } from '$env/dynamic/private'
import { env as publicEnv } from '$env/dynamic/public'

const REQUIRED_ENV = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'PHP_SSO_SECRET',
  'PHP_SSO_COOKIE_NAME',
  'PUBLIC_PHP_BASE_URL',
] as const

function readBaseUrl(): string {
  const url = publicEnv.PUBLIC_PHP_BASE_URL
  if (!url) throw new Error('PUBLIC_PHP_BASE_URL is not set')
  return url.replace(/\/+$/, '')
}

/**
 * Return the parent cookie domain for the PHP host.
 *   - `localhost` -> `localhost`
 *   - IPv4 literal (e.g. 127.0.0.1) -> hostname as-is
 *   - `pay-test.commongood.earth` -> `.commongood.earth`
 * Returned value is suitable to pass directly as the `domain` attribute on
 * `cookies.set(...)`.
 */
export function cookieDomainFor(hostname: string): string {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return hostname
  const parts = hostname.split('.')
  if (parts.length < 2) return hostname
  return '.' + parts.slice(-2).join('.')
}

/** Full URL for a cgpay-* endpoint on the configured PHP host. */
export function phpEndpointUrl(endpoint: string): string {
  const base = readBaseUrl()
  return `${base}/${endpoint.replace(/^\/+/, '')}`
}

export function phpSsoUrl(): string {
  return phpEndpointUrl('cgpay-sso')
}

export function phpGrantsUrl(): string {
  return phpEndpointUrl('cgpay-grants')
}

/** Parent cookie domain for the PHP host, derived from PUBLIC_PHP_BASE_URL. */
export function phpCookieDomain(): string {
  const base = readBaseUrl()
  return cookieDomainFor(new URL(base).hostname)
}

/** Hostname (no scheme, no port) of the PHP server. */
export function phpHostname(): string {
  const base = readBaseUrl()
  return new URL(base).hostname
}

/**
 * Validate every required env var is present. Called once at startup from
 * hooks.server.ts; throws a single error listing everything missing so the
 * operator fixes the config in one pass instead of chasing cascading failures.
 */
export function assertRequiredEnv(): void {
  const missing: string[] = []
  for (const name of REQUIRED_ENV) {
    const value = name === 'PUBLIC_PHP_BASE_URL' ? publicEnv[name] : privateEnv[name]
    if (!value || value.trim() === '') missing.push(name)
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars: ${missing.join(', ')}. ` +
        `Set them in web/.env (see web/.env.example) and restart.`,
    )
  }
  // Fail fast if the base URL is unparseable so the derived helpers don't
  // throw later from inside a request handler.
  try {
    new URL(readBaseUrl())
  } catch {
    throw new Error('PUBLIC_PHP_BASE_URL is not a valid URL.')
  }
}
