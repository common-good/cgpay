import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// New code reads the upeople and accounts views, so it survives the planned split of the users table.
const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true })
  .flatMap(f => f.isDirectory() ? files(join(dir, f.name)) : /\.(ts|svelte)$/.test(f.name) ? [join(dir, f.name)] : [])

describe('users table', () => {
  it('is not queried directly in src', () => {
    const bad = files('src').filter(f => /\b(FROM|JOIN|INTO|UPDATE)\s+`?users\b/i.test(readFileSync(f, 'utf8')))
    expect(bad).toEqual([])
  })
})
