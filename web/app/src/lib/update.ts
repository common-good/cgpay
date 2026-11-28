// Whether this build is older than the oldest the server still accepts (the server's APP_MIN_VERSION), and where to get a newer one.
// Only a store build asks: the screens served on the website are always current.
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { call } from './auth'

/** Version a is older than b (dotted numbers: 1.10 is newer than 1.9). */
export function older(a: string, b: string) {
  const x = a.split('.').map(Number), y = b.split('.').map(Number)
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0)
  return false
}

/** The store page for an update this build needs ('' if the server names none), or null when none is needed or the server cannot say (offline never blocks). */
export async function needsUpdate(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const [{ version }, { status, data }] = await Promise.all([CapApp.getInfo(), call('version', {}, 5000)])
    return status === 200 && data.min && older(version, String(data.min)) ? String(data.store?.[Capacitor.getPlatform()] ?? '') : null
  } catch { return null }
}
