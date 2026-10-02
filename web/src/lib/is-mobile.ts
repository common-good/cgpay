// Mobile detection: used to route Pay/Receive buttons on the dashboard to the
// node-side /pay and /receive pages (QR + Scan + Type flow) instead of jumping
// straight to the PHP tx pages. Desktop keeps the direct-to-PHP behavior.
//
// Heuristic: coarse pointer OR narrow viewport. Covers phones (coarse+narrow)
// without false-positives on touchscreen laptops that stay wide. Called from
// `onMount` so it's always client-side; the SSR default is false, which keeps
// the desktop link in the initial HTML so first paint on desktop is correct.

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.matchMedia('(max-width: 720px)').matches
  return coarse && narrow
}
