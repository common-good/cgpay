import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { stepOrderProblems } from '../support/step-order'

describe('steps.ts', () => {
  it('has the GWhen steps, a blank line, then the Then steps, each in alphabetical order', () => {
    expect(stepOrderProblems(readFileSync('tests/steps/steps.ts', 'utf8'))).toEqual([])
  })
})
