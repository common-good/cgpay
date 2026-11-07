import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { featureLayoutProblems } from '../support/feature-layout'

describe('featureLayoutProblems', () => {
  const good = [
    'Scenario: s',
    '  Given a',
    '  When b',
    '  Then c',
    '  And d',
    '',
    '  When e',
    '  And f',
    '  Then g'
  ].join('\n')

  it('accepts a blank line before a When that follows a Then', () => {
    expect(featureLayoutProblems(good)).toEqual([])
  })
  it('flags a When or Given right after a Then or its And steps', () => {
    expect(featureLayoutProblems(good.replace('\n\n', '\n'))[0]).toMatch(/line 6: "When e" comes after a Then/)
    expect(featureLayoutProblems(good.replace('  When e', '  Given e').replace('\n\n', '\n'))[0]).toMatch(/"Given e"/)
  })
  it('does not ask for a blank line before And or But, or before the first steps of a scenario', () => {
    expect(featureLayoutProblems('Scenario: s\n  Then a\n  And b\n  But c')).toEqual([])
  })
  it('starts over at each scenario, rule and background', () => {
    expect(featureLayoutProblems('Scenario: one\n  Then a\nScenario: two\n  Given b\n  Then c\nRule: r\n  Given d')).toEqual([])
  })
  it('wants the blank line after a table too', () => {
    expect(featureLayoutProblems('Scenario: s\n  Then t:\n  | a |\n  | 1 |\n  When x')).toHaveLength(1)
    expect(featureLayoutProblems('Scenario: s\n  Then t:\n  | a |\n  | 1 |\n\n  When x')).toEqual([])
  })
})

describe('the feature files', () => {
  const dir = 'tests/features'
  for (const file of readdirSync(dir).filter(f => f.endsWith('.feature'))) {
    it(`${file} puts a blank line before a Given or When that follows a Then`, () => {
      expect(featureLayoutProblems(readFileSync(`${dir}/${file}`, 'utf8'))).toEqual([])
    })
  }
})
