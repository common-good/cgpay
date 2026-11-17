// Where the app keeps its sign-in token: the phone's Keychain (iOS) or Keystore (Android) through a plugin.
// Anywhere else (browsers, the BDD tests) it falls back to the app's ordinary store.
import { Capacitor } from '@capacitor/core'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'
import { store } from '../storage'

const native = () => Capacitor.isNativePlatform()

export const secret = {
  get: async (key: string): Promise<string | undefined> => native() ? SecureStoragePlugin.get({ key }).then(r => r.value, () => undefined) : store.get<string>('secure:' + key),
  set: async (key: string, value: string) => { if (native()) await SecureStoragePlugin.set({ key, value }); else await store.set('secure:' + key, value) },
  del: async (key: string) => { if (native()) await SecureStoragePlugin.remove({ key }).catch(() => {}); else await store.del('secure:' + key) }
}
