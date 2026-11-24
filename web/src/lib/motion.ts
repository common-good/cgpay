import { browser } from '$app/environment'

/** A transition length in ms, or 0 when the user asks the system for reduced motion. */
export const ms = (n: number) => browser && matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : n

/** Keep the page behind an open sheet or menu from scrolling. */
export const lockScroll = (on: boolean) => { if (browser) document.documentElement.classList.toggle('locked', on) }

/** Move keyboard focus into an element when it appears (dialogs, sheets). */
export function focusIn(node: HTMLElement) { node.focus({ preventScroll: true }) }

/**
 * Let a touch drag a bottom sheet down; past `far` px (or a quick flick) it calls close, otherwise it springs back.
 * Starts only when the sheet is scrolled to its top, so scrolling a long list still works.
 */
export function swipeDown(node: HTMLElement, close: () => void) {
  const far = 80
  let y0 = 0, t0 = 0, dy = 0, on = false
  const set = (v: number, animate: boolean) => {
    node.style.transition = animate ? `transform ${ms(200)}ms cubic-bezier(0.2, 0.8, 0.2, 1)` : 'none'
    node.style.transform = v ? `translateY(${v}px)` : ''
  }
  const start = (e: TouchEvent) => {
    if (node.scrollTop > 0) return
    on = true; y0 = e.touches[0].clientY; t0 = Date.now(); dy = 0
  }
  const move = (e: TouchEvent) => {
    if (!on) return
    dy = Math.max(0, e.touches[0].clientY - y0)
    if (dy > 0) { e.preventDefault(); set(dy, false) }
  }
  const end = () => {
    if (!on) return
    on = false
    const flick = dy > 30 && Date.now() - t0 < 250
    if (dy > far || flick) close()
    else set(0, true)
  }
  node.addEventListener('touchstart', start, { passive: true })
  node.addEventListener('touchmove', move, { passive: false })
  node.addEventListener('touchend', end)
  node.addEventListener('touchcancel', end)
  return {
    destroy() {
      node.removeEventListener('touchstart', start)
      node.removeEventListener('touchmove', move)
      node.removeEventListener('touchend', end)
      node.removeEventListener('touchcancel', end)
    }
  }
}
