import './styles/app.base.styl'
import Root from './modules/Root.svelte'
import { registerSW } from 'virtual:pwa-register'

// --------------------------------------------

registerSW({ immediate: true })
if (typeof window !== 'undefined') import('./pwa') // for if we use SSG/SSR

if (typeof process !== 'undefined' && process.stdout._handle) process.stdout._handle.setBlocking(true) // thanks to https://stackoverflow.com/questions/5127532/is-node-js-console-log-asynchronous coment #3

export default new Root({
  target: document.getElementsByTagName('main')[0]
})
