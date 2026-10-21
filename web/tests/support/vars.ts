import { isBuiltInName } from './magic'

// Scenario variables: defined with 'var "name" is ...' and used as %name (see magic.ts).
// Each scenario gets a fresh Vars, so nothing leaks from one scenario to the next.
export class Vars {
  private values = new Map<string, unknown>()
  private randoms = new Map<string, string>()

  set(name: string, value: unknown) {
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) throw new Error(`Bad variable name "${name}". Use letters, digits and underscores, starting with a letter.`)
    if (isBuiltInName(name)) throw new Error(`Variable name "${name}" is already a magic value.`)
    this.values.set(name, value)
  }

  has(name: string): boolean { return this.values.has(name) }

  get(name: string): unknown {
    if (!this.values.has(name)) throw new Error(`Unknown variable %${name}.`)
    return this.values.get(name)
  }

  /** A random value that stays the same for the scenario (%random1 and the like): made once per key. */
  random(key: string, make: () => string): string {
    if (!this.randoms.has(key)) this.randoms.set(key, make())
    return this.randoms.get(key) as string
  }
}

/** The value of the {value} part of a step: a quoted string, a number, or a JSON array or object. */
export function parseValue(text: string): unknown {
  if (/^["']/.test(text)) return text.slice(1, -1)
  return JSON.parse(text)
}
