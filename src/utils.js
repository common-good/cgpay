import store from '#store.js'
import queryString from 'query-string'
import { navigateTo } from 'svelte-router-spa'
import { sha256 } from 'js-sha256'

const api = _apis_[location.href.startsWith(_productionUrl_) ? 'real' : 'demo']

function dlg(title, text, labels, m1, m2) {
  const m0 = [true, title, text, labels]
  return { m0, m1, m2 }
}

function yesno(question, m1, m2) {
  return dlg('Confirm', question, 'Yes, No', m1, m2)
}

function confirm(question) {
  return dlg('Alert', question, 'OK', null, null)
}

function hash(s) {
  const hash = sha256.create()
  hash.update(s)
  return hash.hex()
}

function crash(er) { console.log(er); return er.message }

function goEr(msg) {
  store.setMsg(msg)
  navigateTo('/home')
}

function goHome(msg) {
  store.setMsg(msg)
  navigateTo('/home')
}

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
async function timedFetch(url, options = {}) {
  if (!store.inspect().online) throw new Error('offline') // this works for setWifiOff also
  if (options.method != 'POST') url += '&version=' + _version_
  const { timeout = _fetchTimeoutMs_, type = 'json' } = options;
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
}

async function postRequest(endpoint, v) {
  v.version = _version_
  return await timedFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-type':'application/x-www-form-urlencoded' },
    mode: 'cors',
    cache: 'default',
    body: queryString.stringify(v)
  })
}

function isTimeout(er) { return (typeof er === 'object' && er.name == 'AbortError') }
function pageUri() { return location.href.substring(location.href.lastIndexOf('/') + 1) }

/**
 * Filter an object by key and/or value (just like for an array)
 * @param {*} obj0 
 * @param {*} fn: callback function like (key) => <truthy expression>
 * @returns the filtered object
 */
function filterObjByKey(obj0, fn) {
  throw new Error('NYI')
  return Object.keys(obj0)
  .filter(fn)
  .reduce((obj, key) => { obj[key] = obj0[key]; return obj }, {})
}

function isApple() { return /iPhone|iPod|iPad/i.test(navigator.userAgent) }
function isAndroid() { return !isApple() && /Android/i.test(navigator.userAgent) }
function isSafari() {
  const ua = navigator.userAgent
  return isApple() && /WebKit/i.test(ua) && !/CriOS/i.test(ua) && !/OPiOS/i.test(ua)
}
function isChrome() {
  const ua = navigator.userAgent
  return /Chrome/i.test(ua) && !/Chromium/i.test(ua)
}
function addableToHome() { 
  if (store.inspect().sawAdd) return false
  return (isApple() && isSafari()) || (isAndroid() && isChrome())
}

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

function disableBack() {
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

export { confirm, yesno, dlg, hash, crash, goEr, goHome, timedFetch, postRequest, isTimeout, pageUri, isApple, isAndroid, isSafari, isChrome, addableToHome }
