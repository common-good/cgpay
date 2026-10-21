import { resolve, type MagicCtx } from './magic'

const TIME_FIELD = /^(created|modified|updated|received|ckDate|documented)$|(Date|Time)$/
const TIME_SLACK_SECS = 3

/**
 * Compare what the app has (got) to what a table says it should have (want).
 * Only the keys in want are compared. In a wanted value: ? means anything, !x means anything but x,
 * an empty value matches null or empty, numbers compare as numbers, and time fields may differ by a few seconds.
 * @returns the problems found (an empty list means they match)
 */
export function rowProblems(got: Record<string, unknown>[], want: Record<string, unknown>[], ctx: MagicCtx): string[] {
  const problems: string[] = []
  if (got.length !== want.length) problems.push(`got ${got.length} rows, wanted ${want.length}`)
  for (let i = 0; i < Math.min(got.length, want.length); i++) {
    for (const [field, w] of Object.entries(want[i])) {
      if (!matches(got[i][field], w, field, ctx)) problems.push(`row ${i + 1} "${field}": got ${JSON.stringify(got[i][field])}, wanted ${JSON.stringify(w)}`)
    }
  }
  return problems
}

function matches(got: unknown, want: unknown, field: string, ctx: MagicCtx): boolean {
  if (want === '?') return true
  if (typeof want === 'string' && want.startsWith('!')) return !matches(got, resolve(want.slice(1), field, ctx), field, ctx)
  if (isEmpty(got) && isEmpty(want)) return true
  if (isNumber(got) && isNumber(want)) return TIME_FIELD.test(field) ? Math.abs(+got - +want) <= TIME_SLACK_SECS : +got === +want
  return String(got) === String(want)
}

function isEmpty(v: unknown): boolean { return v === null || v === undefined || v === '' }
function isNumber(v: unknown): v is string | number { return (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '')) && !isNaN(+v) }
