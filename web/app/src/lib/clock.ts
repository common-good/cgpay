// The phone's clock against the server's. Transactions carry their time, and a phone's clock can be far off, so the app keeps the
// difference from the server's last answer (kept for starts without a signal too) and adds it, and asks the member to fix a clock far off.
import { store } from '../storage'

let offset = 0 // ms the server's clock is ahead of the phone's

/** The time by the server's clock, as well as the app knows it. */
export const now = () => Date.now() + offset

/** How many minutes the phone's clock is slow (positive) or fast (negative), when it is off by more than 5; else 0. */
export const clockOff = () => Math.abs(offset) > 5 * 60_000 ? Math.round(offset / 60_000) : 0

export async function loadClock() { offset = (await store.get<number>('clockOffset').catch(() => 0)) ?? 0 }

/** The server said it was server (ms) when answering a request sent at sent (the phone's ms): take the middle of the round trip. */
export async function setClock(server: number, sent: number) {
  offset = server - (sent + Date.now()) / 2
  await store.set('clockOffset', offset).catch(() => {})
}
