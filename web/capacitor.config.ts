import type { CapacitorConfig } from '@capacitor/cli'

// Hybrid app: app-dist (built from app/ by vite.app.config.ts) is bundled; links to the hosts below load the live site in the same WebView, so it shares the session cookie. Other hosts open in the system browser.
const config: CapacitorConfig = {
  appId: 'earth.commongood.cgpay',
  appName: 'CGPay',
  webDir: 'app-dist',
  appendUserAgent: 'CGPayApp',
  server: { allowNavigation: ['test.commongood.earth', '*.test.commongood.earth'] }
}

export default config
