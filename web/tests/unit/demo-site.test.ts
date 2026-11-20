import { describe, it, expect } from 'vitest'
import { isDemoSite } from '../../src/lib/demo'

describe('isDemoSite', () => {
  it('is true only for the demo env\'s PHP host', () => {
    expect(isDemoSite('https://demo.commongood.earth/')).toBe(true)
    expect(isDemoSite('https://test.commongood.earth')).toBe(false)
    expect(isDemoSite('https://commongood.earth')).toBe(false)
    expect(isDemoSite('http://localhost/cg/cgmembers')).toBe(false)
    expect(isDemoSite('')).toBe(false)
  })
})
