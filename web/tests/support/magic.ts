import type { Vars } from './vars'
import { nicknameFor } from './accounts'

// Magic values in feature files. Account nicknames (Abe, Bea, ...) are bare words; everything else starts with %.
//
//   %now %now0 %yesterday %tomorrow %yearAgo %monthAgo %lastm %thism   unix seconds ("0" after the name means start of that day)
//   %now-2d  %yesterday+3h  %now0-1w                                    offsets: n (minutes) h d w m y
//   %ymd %dmy %dmqy %dm %mdy %mdY %md %mY %lastmy %lastmd %lastmdy %todayn   the same times, as formatted dates (offsets work too: %dmy-3d)
//   %random %random1 %random2 %random3   random text (1 to 3 stay the same for the scenario)
//   %number %number1 ... %number5        random phone number (1 to 5 stay the same for the scenario)
//   %null %true %false                   (only as a whole value)
//   %_ (a space)  %% (a percent sign)  %name (a variable, see vars.ts)
//
// Not implemented (in the PHP gherkin compiler): %CONSTANT, %(expression), %id, %chunk, %whatever.
// Day boundaries use the local time zone, which the test config pins to America/New_York (the PHP server's zone).

export type MagicCtx = { vars: Vars, now: number } // now: unix seconds, the same all through a scenario
export type MagicOpts = { nicknames?: boolean } // false: leave account nicknames alone (variables keep them until used)

const FORMATS: Record<string, string> = {
  ymd: 'yyyy-MM-dd', dmy: 'ddMMMyyyy', dmqy: "ddMMM''yy", dm: 'dd-MMM', mdy: 'MM/dd/yy', mdY: 'MM/dd/yyyy', md: 'MMM dd', mY: 'MMM yyyy',
  lastmy: 'MMMyyyy', lastmd: 'MMM dd', lastmdy: 'MM/dd/yy', todayn: 'yyyyMMdd'
}
const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')
const BASES = 'now yesterday tomorrow yearAgo monthAgo lastm thism'.split(' ')
const TIME_NAMES = [...BASES, ...Object.keys(FORMATS)]
const OTHER_NAMES = ['null', 'true', 'false', '_', 'random', 'random1', 'random2', 'random3', 'number', 'number1', 'number2', 'number3', 'number4', 'number5']
const TOKEN = /%(%|_|[A-Za-z]\w*)([+-]\d+[nhdwmy])?/g

/** True if name is already a built-in magic value (so a variable can't use it). */
export function isBuiltInName(name: string): boolean {
  const base = name.replace(/0$/, '')
  return OTHER_NAMES.includes(name) || TIME_NAMES.includes(name) || TIME_NAMES.includes(base)
}

/**
 * Replace magic values in a step argument or table cell: variables and % tokens first, then account nicknames.
 * Whole-value tokens keep their type (a number, an array); inside longer text they are substituted as text.
 * Strings that look like JSON arrays or objects are parsed. Anything unknown after a % is an error.
 * @param value: what the feature said (strings, or arrays and objects of them)
 * @param field: the name of the field it goes in (a table column or element id); some nicknames depend on it
 */
export function resolve(value: unknown, field: string | undefined, ctx: MagicCtx, opts: MagicOpts = {}): unknown {
  if (Array.isArray(value)) return value.map(v => resolve(v, field, ctx, opts))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, k, ctx, opts)]))
  if (typeof value !== 'string') return value
  if (/^[[{]/.test(value)) {
    const parsed = tryJson(value)
    if (parsed !== undefined) return resolve(parsed, field, ctx, opts)
  }

  const whole = value.match(new RegExp(`^${TOKEN.source}$`))
  if (whole && (!whole[2] || isTimeToken(whole[1]))) {
    if (ctx.vars.has(whole[1])) return nicknames(ctx.vars.get(whole[1]), field, opts)
    return nicknames(tokenValue(whole[1], whole[2], ctx, true), field, opts)
  }

  return nicknames(value.replace(TOKEN, (all, name, offset) => {
    const rest = isTimeToken(name) ? '' : offset ?? '' // only times take an offset; for anything else it is plain text
    const v = ctx.vars.has(name) ? ctx.vars.get(name) : tokenValue(name, rest ? undefined : offset, ctx, false)
    return String(scalar(v, all)) + rest
  }), field, opts)
}

// The parsed JSON, or undefined if the text is not JSON (so text like [draft] stays text).
function tryJson(s: string): unknown {
  try { return JSON.parse(s) } catch { return undefined }
}

function isTimeToken(name: string): boolean {
  return TIME_NAMES.includes(name) || TIME_NAMES.includes(name.replace(/0$/, ''))
}

function scalar(v: unknown, token: string): string | number {
  if (typeof v === 'string' || typeof v === 'number') return v
  throw new Error(`${token} is not text or a number, so it cannot be part of longer text.`)
}

function nicknames(v: unknown, field: string | undefined, opts: MagicOpts): unknown {
  if (opts.nicknames === false) return v
  if (Array.isArray(v)) return v.map(x => nicknames(x, field, opts))
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, nicknames(x, k, opts)]))
  return typeof v === 'string' ? nicknameFor(v, field) ?? v : v
}

// The value of one % token (name without the %; offset like -2d or undefined).
function tokenValue(name: string, offset: string | undefined, ctx: MagicCtx, whole: boolean): unknown {
  if (name === '%') return '%'
  if (name === '_') return ' '
  if (['null', 'true', 'false'].includes(name)) {
    if (!whole) throw new Error(`%${name} can only be a whole value.`)
    return name === 'null' ? null : name === 'true'
  }
  const random = name.match(/^(random|number)([1-5])?$/)
  if (random) return random[2] ? ctx.vars.random(name, () => makeRandom(random[1])) : makeRandom(random[1])

  const base = name.replace(/0$/, '')
  if (TIME_NAMES.includes(name) || TIME_NAMES.includes(base)) {
    const [timeName, startOfDayToo] = TIME_NAMES.includes(name) ? [name, false] : [base, true]
    return timeValue(timeName, startOfDayToo, offset, ctx.now)
  }
  throw new Error(`Unknown magic value %${name}${offset ?? ''}. Define a variable first, or check the spelling.`)
}

function timeValue(name: string, startOfDayToo: boolean, offset: string | undefined, now: number): number | string {
  const fmt = FORMATS[name]
  const baseName = name.startsWith('last') ? 'lastm' : fmt ? 'now' : name
  let t = baseTime(baseName, now)
  if (startOfDayToo) t = startOfDay(t)
  const m = offset?.match(/^([+-]\d+)([nhdwmy])$/)
  if (m) t = addPeriod(t, +m[1], m[2])
  return fmt ? format(t, fmt) : t
}

function baseTime(name: string, now: number): number {
  switch (name) {
    case 'yesterday': return addPeriod(now, -1, 'd')
    case 'tomorrow': return addPeriod(now, 1, 'd')
    case 'yearAgo': return addPeriod(now, -1, 'y')
    case 'monthAgo': return addPeriod(now, -1, 'm')
    case 'lastm': return startOfDay(addPeriod(setDay1(now), -1, 'm'))
    case 'thism': return startOfDay(setDay1(now))
    default: return now
  }
}

function setDay1(t: number): number { const d = new Date(t * 1000); d.setDate(1); return Math.floor(d.getTime() / 1000) }
function startOfDay(t: number): number { const d = new Date(t * 1000); d.setHours(0, 0, 0, 0); return Math.floor(d.getTime() / 1000) }

function addPeriod(t: number, n: number, unit: string): number {
  const d = new Date(t * 1000)
  if (unit === 'n') d.setMinutes(d.getMinutes() + n)
  else if (unit === 'h') d.setHours(d.getHours() + n)
  else if (unit === 'd') d.setDate(d.getDate() + n)
  else if (unit === 'w') d.setDate(d.getDate() + 7 * n)
  else if (unit === 'm') d.setMonth(d.getMonth() + n)
  else d.setFullYear(d.getFullYear() + n)
  return Math.floor(d.getTime() / 1000)
}

// Format with the pattern letters the named formats use: yyyy yy MMM MM dd, and '' for an apostrophe.
function format(t: number, pattern: string): string {
  const d = new Date(t * 1000)
  const two = (n: number) => String(n).padStart(2, '0')
  const parts: Record<string, string> = {
    yyyy: String(d.getFullYear()), yy: two(d.getFullYear() % 100), MMM: MONTHS[d.getMonth()], MM: two(d.getMonth() + 1), dd: two(d.getDate()), "''": "'"
  }
  return pattern.replace(/yyyy|yy|MMM|MM|dd|''/g, m => parts[m])
}

function makeRandom(kind: string): string {
  const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('')
  if (kind === 'number') return '+1' + (2 + Math.floor(Math.random() * 8)) + digits(9)
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 5 + Math.floor(Math.random() * 11) }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
