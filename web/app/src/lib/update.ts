// Whether this build is older than the oldest the server still accepts (the server's APP_MIN_VERSION), and where to get a newer one.
// Only a store build asks: the screens served on the website are always current.
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update'
import { call } from './auth'
import { setClock } from './clock'

/** Version a is older than b (dotted numbers: 1.10 is newer than 1.9). */
export function older(a: string, b: string) {
  const x = a.split('.').map(Number), y = b.split('.').map(Number)
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0)
  return false
}

/**
 * Ask the server about this build, and set the app's clock from its answer (see clock.ts).
 * Returns the store page for an update this build needs ('' if the server names none), or null when none is needed or the server cannot say (offline never blocks).
 */
export async function needsUpdate(): Promise<string | null> {
  try {
    const sent = Date.now(), { status, data } = await call('version', {}, 5000)
    if (status !== 200) return null
    if (typeof data.time === 'number') await setClock(data.time, sent)
    if (!Capacitor.isNativePlatform() || !data.min) return null
    return older((await CapApp.getInfo()).version, String(data.min)) ? String(data.store?.[Capacitor.getPlatform()] ?? '') : null
  } catch { return null }
}

/** Update now: on Android, Google Play's own update screen when it offers one; otherwise the store page (url). */
export async function updateNow(url: string) {
  if (Capacitor.getPlatform() === 'android') try {
    const i = await AppUpdate.getAppUpdateInfo()
    if (i.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE && i.immediateUpdateAllowed) return void await AppUpdate.performImmediateUpdate()
  } catch {} // not installed from Google Play, or Play cannot be reached
  if (url) location.href = url
}
