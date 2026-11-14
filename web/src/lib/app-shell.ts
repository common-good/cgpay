// The live site also runs inside the store app's WebView, which marks its user agent (appendUserAgent in capacitor.config.ts).
export const inApp = () => typeof navigator !== 'undefined' && navigator.userAgent.includes('CGPayApp')

// The app's bundled screens are served from the app package, under a different origin on each platform.
export function appUrl(params: Record<string, string> = {}) {
  const origin = /iPhone|iPad|Macintosh/.test(navigator.userAgent) ? 'capacitor://localhost' : 'https://localhost'
  return `${origin}/#${new URLSearchParams(params)}`
}
