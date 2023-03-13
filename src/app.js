import './styles/app.base.styl'
import Root from './modules/Root.svelte'
import { registerSW } from 'virtual:pwa-register'

// --------------------------------------------

registerSW({ immediate: true })
if (typeof window !== 'undefined') import('./pwa') // for if we use SSG/SSR

export default new Root({
  target: document.getElementsByTagName('main')[0]
})
