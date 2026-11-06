import { describe, it, expect, beforeEach, vi } from 'vitest'

const privateEnvState: Record<string, string | undefined> = {}
const publicEnvState: Record<string, string | undefined> = {}
vi.mock('$env/dynamic/private', () => ({
  get env() { return privateEnvState }
}))
vi.mock('$env/dynamic/public', () => ({
  get env() { return publicEnvState }
}))

const {
  assertRequiredEnv,
  cookieDomainFor,
  phpCookieDomain,
  phpEndpointUrl,
  phpGrantsUrl,
  phpSsoUrl,
  phpHostname,
} = await import('../../src/lib/server/env')

const REQUIRED_ENV = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_USER: 'u',
  DB_PASSWORD: 'p',
  DB_NAME: 'n',
  PHP_SSO_SECRET: 's',
  PHP_SSO_COOKIE_NAME: 'SESSabc',
  PUBLIC_PHP_BASE_URL: 'http://localhost/cg/cgmembers',
  PUBLIC_TURNSTILE_SITEKEY: '1x00000000000000000000AA',
}

function fillRequired() {
  for (const [k, v] of Object.entries(REQUIRED_ENV)) {
    if (k.startsWith('PUBLIC_')) publicEnvState[k] = v
    else privateEnvState[k] = v
  }
}

beforeEach(() => {
  for (const k of Object.keys(privateEnvState)) delete privateEnvState[k]
  for (const k of Object.keys(publicEnvState)) delete publicEnvState[k]
})

describe('cookieDomainFor', () => {
  it('returns bare hostname for localhost', () => {
    expect(cookieDomainFor('localhost')).toBe('localhost')
  })

  it('returns bare hostname for IPv4 literals', () => {
    expect(cookieDomainFor('127.0.0.1')).toBe('127.0.0.1')
  })

  it('returns .parent-domain for a subdomain', () => {
    expect(cookieDomainFor('pay-test.commongood.earth')).toBe('.commongood.earth')
    expect(cookieDomainFor('new.commongood.earth')).toBe('.commongood.earth')
  })

  it('returns .apex-domain even when the input IS the apex', () => {
    // Still prefixes with "." so a cookie set here is sent to every subdomain,
    // not just the apex.
    expect(cookieDomainFor('commongood.earth')).toBe('.commongood.earth')
  })
})

describe('derived PHP helpers', () => {
  beforeEach(() => { fillRequired() })

  it('phpEndpointUrl joins base + endpoint without losing the base path', () => {
    expect(phpEndpointUrl('cgpay/whoami')).toBe('http://localhost/cg/cgmembers/cgpay/whoami')
  })

  it('phpEndpointUrl tolerates a leading slash on the endpoint', () => {
    expect(phpEndpointUrl('/cgpay/whoami')).toBe('http://localhost/cg/cgmembers/cgpay/whoami')
  })

  it('phpEndpointUrl tolerates a trailing slash on the base URL', () => {
    publicEnvState.PUBLIC_PHP_BASE_URL = 'https://pay-test.commongood.earth/'
    expect(phpEndpointUrl('cgpay/whoami')).toBe('https://pay-test.commongood.earth/cgpay/whoami')
  })

  it('phpSsoUrl + phpGrantsUrl use the same base', () => {
    publicEnvState.PUBLIC_PHP_BASE_URL = 'https://pay-test.commongood.earth'
    expect(phpSsoUrl()).toBe('https://pay-test.commongood.earth/cgpay/sso')
    expect(phpGrantsUrl()).toBe('https://pay-test.commongood.earth/cgpay/grants')
  })

  it('phpCookieDomain derives the parent domain', () => {
    publicEnvState.PUBLIC_PHP_BASE_URL = 'https://pay-test.commongood.earth'
    expect(phpCookieDomain()).toBe('.commongood.earth')
  })

  it('phpCookieDomain returns localhost unchanged', () => {
    expect(phpCookieDomain()).toBe('localhost')
  })

  it('phpHostname returns the host only', () => {
    publicEnvState.PUBLIC_PHP_BASE_URL = 'https://pay-test.commongood.earth/foo'
    expect(phpHostname()).toBe('pay-test.commongood.earth')
  })
})

describe('assertRequiredEnv', () => {
  it('passes when every required var is set', () => {
    fillRequired()
    expect(() => assertRequiredEnv()).not.toThrow()
  })

  it('lists every missing var in a single error', () => {
    // Only set a subset; the rest should be reported.
    privateEnvState.PHP_SSO_SECRET = 's'
    publicEnvState.PUBLIC_PHP_BASE_URL = 'http://localhost'
    const err = (() => { try { assertRequiredEnv() } catch (e) { return e as Error } })()
    expect(err).toBeInstanceOf(Error)
    expect(err!.message).toMatch(/DB_HOST/)
    expect(err!.message).toMatch(/DB_PORT/)
    expect(err!.message).toMatch(/DB_USER/)
    expect(err!.message).toMatch(/DB_PASSWORD/)
    expect(err!.message).toMatch(/DB_NAME/)
    expect(err!.message).toMatch(/PHP_SSO_COOKIE_NAME/)
    expect(err!.message).not.toMatch(/PHP_SSO_SECRET/)
    expect(err!.message).not.toMatch(/PUBLIC_PHP_BASE_URL/)
  })

  it('rejects an empty-string env value (not just undefined)', () => {
    fillRequired()
    privateEnvState.PHP_SSO_SECRET = '   '
    expect(() => assertRequiredEnv()).toThrow(/PHP_SSO_SECRET/)
  })

  it('rejects a malformed PUBLIC_PHP_BASE_URL', () => {
    fillRequired()
    publicEnvState.PUBLIC_PHP_BASE_URL = 'not a url'
    expect(() => assertRequiredEnv()).toThrow(/PUBLIC_PHP_BASE_URL/)
  })
})
