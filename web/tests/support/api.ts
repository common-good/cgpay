import type { App } from '../steps/fixtures'
import { rowProblems } from './compare'
import { tableData } from './table'

// Calls to the app's own JSON endpoints, and checks of what came back.
type Rows = Record<string, unknown>[]

// { errors: { code: 'x' } } becomes { 'errors.code': 'x' }, so a table can name any field.
function flat(o: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  return Object.entries(o).reduce((m, [k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? { ...m, ...flat(v as Record<string, unknown>, `${prefix}${k}.`) } : { ...m, [prefix + k]: v }, {})
}

export default {
  /** Post the row to /api/<path>, signed in as whoever the browser is; the reply is kept for the Then steps. */
  async post(app: App, path: string, table: { raw(): string[][] }) {
    const res = await app.page.request.post(`/api/${path}`, { data: tableData(table, 'row', app) as object })
    app.reply = { http: res.status(), ...flat(await res.json().catch(() => ({}))) }
  },

  /** The last reply has these fields (http, the HTTP status, and any field of the JSON, dotted for nested ones). */
  soReply(app: App, table: { raw(): string[][] }) {
    if (!app.reply) throw new Error('reply row: there is no reply yet. Use post "..." first.')
    const problems = rowProblems([app.reply] as Rows, [tableData(table, 'row', app)] as Rows, app)
    if (problems.length) throw new Error(`reply row: ${problems.join('; ')}`)
  }
}
