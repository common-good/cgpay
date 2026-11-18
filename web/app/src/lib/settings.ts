// The app's settings, kept on the phone (they survive sign-out: they belong to the phone, not the member).
import { store } from '../storage'

export type Settings = { frontCamera: boolean, locked: boolean }
const DFT: Settings = { frontCamera: false, locked: false }

export const settings = async (): Promise<Settings> => ({ ...DFT, ...await store.get<Partial<Settings>>('settings') })
export const setSetting = async (k: keyof Settings, v: boolean) => store.set('settings', { ...await settings(), [k]: v })
