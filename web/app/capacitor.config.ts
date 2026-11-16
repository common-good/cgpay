import type { CapacitorConfig } from '@capacitor/cli'

// Hybrid app: dist (built from src/ by vite.config.ts) is bundled; links to the hosts below load the live site in the same WebView, so it shares the session cookie. Other hosts open in the system browser.
const config: CapacitorConfig = {
  appId: 'earth.commongood.cgpay',
  appName: 'CGPay Trial',
  webDir: 'dist',
  appendUserAgent: 'CGPayApp',
  server: { allowNavigation: ['test.commongood.earth', '*.test.commongood.earth'] }
}

export default config
