import store from './store.js'
import c from '../constants.js'
import queryString from 'query-string'
import { navigateTo } from 'svelte-router-spa'
import u0 from '../utils0.js' // utilities shared with tests

const api = c.apis[u.mode() in ['production', 'staging'] ? 'real' : 'demo']


const u = {
  ...u0, // incorporate all function from utils0.js

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
   * @returns res: the result of the fetch plus a "result" property whose value is either:
   *   On SUCCESS: an object or a blob (a large string)
   *   On FAILURE: (GET status not 200 OR POST status not 201) throw the status
   *   POST /transaction may return {ok, message} whether there is an error or not
   * @throws an AbortError if the fetch times out (identify with isTimeout())
   */
  async timedFetch(url, options = {}) {
    if (!store.inspect().online) throw u.er('Offline') // this works for setWifiOff also
    if (options.method != 'POST') url += '&version=' + c.version
    const { timeout = c.fetchTimeoutMs, type = 'json' } = options;
    const aborter = new AbortController();
    aborter.name = 'Timeout'
    const timeoutId = setTimeout(() => aborter.abort(), timeout)

    const func = typeof window.mockFetch === 'function' ? mockFetch : fetch // mock fetch if testing (keep this line)
    let res = await func(api + url, {...options, signal:aborter.signal })
    if (res.ok === false) throw new Error(res.status)
    if (res.ok && type != 'none') {
      res.result = await (type == 'blob' ? res.blob() : res.json())
      if (options.method == 'POST') res = res.result // a JSON string: {ok, message}
    }

    clearTimeout(timeoutId)
    return res
  },

  async postRequest(endpoint, v) {
    v.version = c.version
    return await u.timedFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-type':'application/x-www-form-urlencoded' },
      mode: 'cors',
      cache: 'default',
      body: queryString.stringify(v)
    })
  },

  mode() {
    return location.href.startsWith(c.urls.production) ? 'production'
    : (location.href.startsWith(c.urls.staging) ? 'staging'
    : (location.href.includes('localhost') ? 'local'
    : 'dev'))
  },
  
  fakeData() { return !(u.mode() in ['production', 'staging']) },
  localMode() { return (u.mode() == 'local') },
  testing() { return typeof window.fromTester === 'function' },
  fromTester() { return (u.testing() && window.fromTester()) },
  yesno(question, m1, m2) { return u.dlg('Confirm', question, 'Yes, No', m1, m2) },
  confirm(question) { return u.dlg('Alert', question, 'OK', null, null) },
  crash(er) { console.log('crash', er); return er.message },
  goEr(msg) { store.setMsg(msg); navigateTo('/home') },
  goHome(msg) { store.setMsg(msg), navigateTo('/home') },
  isTimeout(er) { return (typeof er === 'object' && er.name == 'AbortError' || er.name == 'Offline') },
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
