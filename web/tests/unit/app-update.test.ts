import { describe, it, expect, vi, beforeEach } from 'vitest'

const native = { on: true, platform: 'android' }
vi.mock('../../app/node_modules/@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.on, getPlatform: () => native.platform } }))
vi.mock('../../app/node_modules/@capacitor/app', () => ({ App: { getInfo: async () => ({ version: '1.2' }) } }))
const reply = { status: 200, data: {} as Record<string, unknown>, fail: false }
vi.mock('../../app/src/lib/auth', () => ({ call: async () => { if (reply.fail) throw new TypeError('Failed to fetch'); return reply } }))

const { older, needsUpdate } = await import('../../app/src/lib/update')
const store = { android: 'https://play.example/cgpay', ios: '' }

beforeEach(() => { native.on = true; native.platform = 'android'; Object.assign(reply, { status: 200, data: {}, fail: false }) })

describe('older', () => {
  it('compares dotted versions as numbers', () => {
    expect(older('1.9', '1.10')).toBe(true)
    expect(older('1.10', '1.9')).toBe(false)
    expect(older('1.2', '1.2.0')).toBe(false)
    expect(older('1.2', '1.2.1')).toBe(true)
    expect(older('2', '1.99')).toBe(false)
  })
})

describe('needsUpdate', () => {
  it('names the store page when this build is older than the oldest accepted', async () => {
    reply.data = { min: '1.3', store }
    expect(await needsUpdate()).toBe('https://play.example/cgpay')
  })
  it('asks for an update with no page when the store has none yet', async () => {
    native.platform = 'ios'
    reply.data = { min: '1.3', store }
    expect(await needsUpdate()).toBe('')
  })
  it('asks nothing when the build is new enough, no minimum is set, the server cannot be reached, or on the website', async () => {
    reply.data = { min: '1.2', store }
    expect(await needsUpdate()).toBe(null)
    reply.data = { min: '', store }
    expect(await needsUpdate()).toBe(null)
    reply.fail = true
    expect(await needsUpdate()).toBe(null)
    reply.fail = false; reply.data = { min: '9', store }; native.on = false
    expect(await needsUpdate()).toBe(null)
  })
})
