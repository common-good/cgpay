/*(function() {
  try {
      eval("async function x(){}");
      var main = "${main}"
  } catch (e) {
      main = "${legacy_main}"
  };
  var s = document.createElement("script");
  try {
      new Function("if(0)import('')")();
      s.src = main;
      s.type = "module";
      s.crossOrigin = "use-credentials";
  } catch (e) {
      s.src = "${req.baseUrl}/client/shimport@${build_info.shimport}.js";
      s.setAttribute("data-main", main);
  }
  document.head.appendChild(s);
}()); */

import './styles/app.base.styl'
import Root from './modules/Root.svelte'
import { registerSW } from 'virtual:pwa-register'

function disableBackButton() {
  history.pushState(null, document.title, location.href)
  history.back()
  history.forward()
  window.onpopstate = function () { history.go(1) }
}

registerSW({ immediate: true })
if (typeof window !== 'undefined') import('./pwa') // for if we use SSG/SSR

if (typeof process !== 'undefined' && process.stdout._handle) process.stdout._handle.setBlocking(true) // thanks to https://stackoverflow.com/questions/5127532/is-node-js-console-log-asynchronous coment #3

disableBackButton()

export default new Root({ target:document.getElementsByTagName('main')[0] })
