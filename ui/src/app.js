import './styles/app.base.styl'
import Root from './modules/Root/Root.svelte'

// --------------------------------------------

export default new Root({
  target: document.getElementsByTagName('main')[0]
})
