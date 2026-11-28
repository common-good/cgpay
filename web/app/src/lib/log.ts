// The app's own short log, kept on the phone and sent with Feedback, so the tech team can see what went wrong: the last 200 lines.
// Errors and failed server calls only; never card codes, tokens or passwords.
import { store } from '../storage'

const KEY = 'log', MAX = 200
type Line = [number, string]
let chain: Promise<unknown> = Promise.resolve()

/** Add a line. Lines added at once keep their order; a log that cannot be written is only lost. */
export const log = (m: string) => chain = chain.then(async () => {
  const ls = (await store.get<Line[]>(KEY)) ?? []
  ls.push([Date.now(), m.slice(0, 300)])
  await store.set(KEY, ls.slice(-MAX))
}).catch(() => {})

/** The log as text, oldest line first. */
export const logText = async () => ((await store.get<Line[]>(KEY).catch(() => undefined)) ?? []).map(([t, m]) => `${new Date(t).toISOString()} ${m}`).join('\n')
