/** Whether this site is the demo env (its PHP host is demo.<domain>), where no money is real. */
export function isDemoSite(phpBase = '') {
  try { return new URL(phpBase).hostname.split('.')[0] === 'demo' } catch { return false }
}
