import store from '#store.js'
import c from '#constants.js'
import queryString from 'query-string'
import { navigateTo } from 'svelte-router-spa'
import u0 from '../utils0.js' // utilities shared with tests

const u = {
  ...u0, // incorporate all function from utils0.js

  api() { return u.realData() ? c.apis.real : c.apis.test }, 

  dlg(title, text, labels, m1, m2) {
    const m0 = [true, title, text, labels]
    return { m0, m1, m2 }
  },

  /**
   * Fetch from the server API and return and object (or a blob if specified in the options).
   * @param {*} url: the enpoint to fetch from (without the API path)
   * @param {*} options: 
   *   timeout: the number of miliseconds
   *   type: 'json' (default) or 'blob'
   *   method: 'POST' or 'GET'
   *   etc.
   * @param bool post: if true, called from postRequest
   * @returns res: the result of the fetch plus a "result" property whose value is either:
   *   On SUCCESS: an object or a blob (a large string)
   *   On FAILURE: (GET status not 200 OR POST status not 201) throw the status
   *   POST /transaction may return {ok, message} whether there is an error or not
   * @throws an AbortError if the fetch times out (identify with isTimeout())
   */
  async timedFetch(url, options = {}, post = false) {
    if (!store.inspect().online) throw u.er('Offline') // this works for setWifiOff also
    if (!post) {
      url += '&version=' + c.version
      const urlRay = url.split('?')
      u.tellTester('post', { endpoint:urlRay[0], v:urlRay[1].split('&'), method:'get' })
    }
    const { timeout = c.fetchTimeoutMs, type = 'json' } = options;
    const aborter = new AbortController();
    aborter.name = 'Timeout'
    const timeoutId = setTimeout(() => aborter.abort(), timeout)

    const func = typeof window.mockFetch === 'function' ? mockFetch : fetch // mock fetch if testing (keep this line)
    
    let res = await func(u.api() + url, {...options, signal:aborter.signal })
    if (res.ok === false) throw new Error(res.status)
    if (res.ok && type != 'none') {
      res.result = await (type == 'blob' ? res.blob() : res.json())
      if (post) res = res.result // a JSON string: {ok, message}
    }

    clearTimeout(timeoutId)
    return res
  },

  async postRequest(endpoint, v) {
    store.bump('posts')
    v.version = c.version
    u.tellTester('post', { endpoint:endpoint, v:{ ...v }, method:'post' })
    return await u.timedFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-type':'application/x-www-form-urlencoded' },
      mode: 'cors',
      cache: 'default',
      body: queryString.stringify(v)
    }, true)
  },

  mode() { 
    return location.href.startsWith(c.urls.production) ? 'production' 
    : (location.href.startsWith(c.urls.staging) ? 'staging' 
    : (location.href.includes('localhost') ? 'local' 
    : 'dev')) 
  }, 
  
  now() { return (u.testing()) ? store.inspect().now : u.now0() }, // keep "now" constant in tests
  realData() { return ['production', 'staging'].includes(u.mode()) },
  localMode() { return (u.mode() == 'local') }, 
  testing() { return typeof window.testerPipe === 'function' },
  fromTester() { return (u.testing() && window.testerPipe()) },
  tellTester(k, v = null) { if (u.testing()) window.testerPipe(k, v) },
  yesno(question, m1, m2) { return u.dlg('Confirm', question, 'Yes, No', m1, m2) },
  confirm(question) { return u.dlg('Alert', question, 'OK', null, null) },
  crash(er) { console.log('crash', er); return er.message },
  goEr(msg) { store.setMsg(msg); navigateTo('/home') },
  goHome(msg) { store.setMsg(msg); navigateTo('/home') },
  isTimeout(er) { return (typeof er === 'object' && (er.name == 'AbortError' || er.name == 'Offline')) },
  pageUri() { return location.href.substring(location.href.lastIndexOf('/') + 1) },
  isApple() { return /iPhone|iPod|iPad/i.test(navigator.userAgent) },
  isAndroid() { return !u.isApple() && /Android/i.test(navigator.userAgent) },

  isSafari() {
    const ua = navigator.userAgent
    return u.isApple() && /WebKit/i.test(ua) && !/CriOS/i.test(ua) && !/OPiOS/i.test(ua)
  },

  isChrome() {
    const ua = navigator.userAgent
    return /Chrome/i.test(ua) && !/Chromium/i.test(ua)
  },

  addableToHome() { 
    if (store.inspect().sawAdd) return false
    return (u.isApple() && u.isSafari()) || (u.isAndroid() && u.isChrome())
  },

  /*
  async function cgEncrypt(text) {
  console.log('before readKey');
    const publicKey = await readKey({ armoredKey: cgPublicKey });
    console.log('after readKey');
    const crypt = await encrypt({
      message: await createMessage({ text: text }), // input as Message object
      encryptionKeys: publicKey,
    });

  //    return btoa(crypt).replace('+', '-').replace('_', '/')
  }

  disableBack() {
    history.pushState(null, null, location.href)
    onpopstate = function () {history.go(1)}
  }

  */

  /* for POST auth in HTTP header (any advantage?)
          'authorization': `Bearer ${ $store.myAccount.deviceId }`,
          'Accept': 'application/json',
          'Content-type': 'application/json',
          body: JSON.stringify(tx)
  */
}

export default u
