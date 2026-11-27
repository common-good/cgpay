import type { CapacitorConfig } from '@capacitor/cli'

// Hybrid app: dist (built from src/ by vite.config.ts) is bundled; links to the hosts below load the live site in the same WebView, so it shares the session cookie. Other hosts open in the system browser.
// An app reaches only two envs: the one it starts at (START_ENV when building, like VITE_START_ENV for the screens; default test) and demo, so a test build can never open main.
const start = process.env.START_ENV || 'test'
const hosts = (e: string) => [`${e}.commongood.earth`, `*.${e}.commongood.earth`]
const config: CapacitorConfig = {
  appId: 'earth.commongood.cgpay',
  appName: 'CGPay Trial',
  webDir: 'dist',
  appendUserAgent: 'CGPayApp',
  server: { allowNavigation: [...new Set([...hosts(start), ...hosts('demo')])] },
  // The store's database (storage.ts encrypts its values itself): on iOS in Library, not Documents, which the Files app can show.
  plugins: { CapacitorSQLite: { iosDatabaseLocation: 'Library/CapacitorDatabase', iosIsEncryption: false, androidIsEncryption: false } }
}

export default config
