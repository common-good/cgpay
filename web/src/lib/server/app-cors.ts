import { env as publicEnv } from '$env/dynamic/public'

// The origins the store app's bundled screens are served from: https://localhost (Android), capacitor://localhost (iOS), and
// PUBLIC_APP_URL (where the tests serve them). Only these may call /api/app/*; the browser website never needs to.
const origins = () => ['https://localhost', 'capacitor://localhost', publicEnv.PUBLIC_APP_URL ?? ''].filter(Boolean).map(o => o.replace(/\/+$/, ''))

/** Add the CORS headers to a response to /api/app/* if the caller is one of the app's origins (and answer its preflight). */
export function appCors(request: Request, res: Response) {
  const origin = request.headers.get('origin')
  if (!origin || !origins().includes(origin)) return request.method === 'OPTIONS' ? new Response(null, { status: 403 }) : res
  res.headers.set('Access-Control-Allow-Origin', origin)
  res.headers.set('Vary', 'Origin')
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  res.headers.set('Access-Control-Max-Age', '600')
  return res
}
