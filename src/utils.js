import st from'#store.js'
import c from '#constants.js'
import queryString from 'query-string'
import { navigateTo } from 'svelte-router-spa'
import u0 from '../utils0.js' // utilities shared with tests
import QRCode from 'qrcode'

const dig36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const regionLens = '111111112222222233333333333344444444'
const acctLens = '222233332222333322223333444444445555'
const agentLens = '012301230123012301230123012301230123'
const mainLens = '.12.13.22.23.32.33.34.44.45' // region and acct lens without agent

const u = {
  ...u0, // incorporate all function from utils0.js
  undo: null, // notify subscribers every time the Back button is clicked when it means "undo" (see Layout.svelte)

  api() { return u.realData() ? c.apis.real : c.apis.test }, 
  socketURL() { return u.realData() ? c.sockets.real : c.sockets.test }, 

  dlg(title, text, labels, m1 = u.hide, m2 = null) {
    const m0 = [true, title, text, labels]
    st.setModal(m0, m1, m2)
    return false // helpful for displaying error messages (eg return alert('bad input'))
  },

  /**
   * Fetch from the server API and return and object (or a blob if specified in the options).
   * @param {*} url: the enpoint to fetch from (without the API path)
   * @param {*} options: 
   *   timeout: the number of milliseconds
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
    if (!u.st().online) throw u.er('Offline') // this works for setWifiOff also
    if (!post) {
      if (!url.includes('version=')) url += '&version=' + c.version
      const urlRay = url.split('?')
      await u.tellTester('get', urlRay[0], urlRay[1].split('&'))
    }
//    console.log('fetch post url options', post, url, options)
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

  async postRequest(endpoint, v, options = {}) {
//    console.log('post', endpoint, v, options)
    st.bump('posts')
    if (!v.version) v.version = c.version
    await u.tellTester('post', endpoint, { ...v })
    return await u.timedFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-type':'application/x-www-form-urlencoded' },
      mode: 'cors',
      cache: 'default',
      body: queryString.stringify(v),
      ...options,
    }, true)
  },

  /**
   * Open a websocket to communicate with the server and, indirectly, with other devices
   * @returns a websocket
   */
  socket() {
    if (!c.enableSockets) return null
    if (u.st().me.isCo) return null // only for individual accounts for now
    if (!('WebSocket' in window)) return null

    if (u.st().socket) try {
      u.st().socket.close() // for now, reopen every time
    } catch (er) {}

    let socket
    try {
      socket = new WebSocket(u.socketURL()) // socket.readyState has status
      socket.onopen = () => {
        const msg = JSON.stringify({ op:'connect', deviceId:u.st().me.deviceId, actorId:u.st().me.accountId })
        try {
          socket.send(msg)
        } catch (er) { console.log('socket error', er) }
      }
      socket.onclose = () => {}			
      socket.onmessage = (msg) => {
        const m = JSON.parse(msg.data) // get message, action, and note

        if (m.action == 'request') {
          u.yesno(m.message, () => st.txConfirm(true, m), () => st.txConfirm(false, m))
        } else {
          u.alert(m.message)
          u.getInfo() // if we're being told about a charge or payment, refresh the list of recent txs
        }
      }
    } catch(er) { console.log('socket error', er); return null }

    return socket
  },

  async generateQr(text) {
    try {
      return await QRCode.toDataURL(text, {'width': 310})
    } catch (er) { console.error(er) }
  },

  makeQrUrl(acctId) {
    const c1 = acctId.charAt(0)
    const f = dig36.indexOf(c1)
    const regLen = +regionLens.charAt(f)
    const domain = c.domains[u.realData() ? 'real' : 'test']
    return 'HTTP://' + acctId.substring(1, 1 + regLen) + `.${domain}/` + c1 + acctId.substring(1 + regLen)
  },
  
  /**
   * Parse the given account identifier from a QR code.
   * Note that the cardCode part of the account identifier ranges from 9-15 chars (and may be extended to 20 someday)
   * @param qr: the QR code to parse
   * @return { acct, code, hash } where the accountId is separated into acct and code and hash is the cardCode hashed for storage
   */
  qrParse(qr) {
    let acct, testing
    const parts = qr.split(/[\/.]/)

/*    if ((new RegExp('^[0-9A-Za-z]{12,29}[\.!]$')).test(qr)) { // like H6VM0G0NyCBBlUF1qWNZ2k.
      acct = parts[0]
      testing = qr.slice(-1) == '.'
    } else */
    if ((new RegExp(c.qrUrlRegex)).test(qr)) { // like HTTP://6VM.RC4.ME/KDJJ34kjdfKJ4
      acct = parts[5][0] + parts[2] + parts[5].substring(1)
      testing = qr.startsWith(c.testQrStart)
    } else throw new Error('That is not a valid Common Good QR Code format.')

    if (testing && u.realData()) throw new Error('That is a CGPay test QR Code and cannot be used in production mode.')
    if (!testing && !u.realData()) throw new Error('That is a real Common Good QR Code and cannot be used in test mode.')

    const agentLen = +agentLens[dig36.indexOf(acct[0])]
    const mainId = u.getMainId(acct)
    const acct0 = acct.substring(0, mainId.length + agentLen) // include agent chars in original account ID
    const code = acct.substring(acct0.length)
    return { acct: acct0, main: mainId, code: code, hash: u.hash(code) }
  },
  
  qrEr(er) {
    if (isNaN(er.message)) return er.message
    if (er.message == '404') return 'That is not a valid Common Good member QR Code.' // account not found
    return u.crash(`An unexpected error occurred. Please alert Common Good's support team.`)
  },

  /**
   * Return just the region and acct parts of the QR.
   */
  getMainId(acct) { 
    const i = dig36.indexOf(acct[0])
    const c1 = dig36[4 * mainLens.indexOf('.' + regionLens[i] + acctLens[i]) / 3] // format character without agent
    return c1 + acct.substring(1, 1 + +regionLens[i] + +acctLens[i])
  },

  /**
   * Return just the cardCode from the cardId.
   */
  cardCode(cardId) {
    const len = u.noCardCode(cardId).length
    return cardId.substring(len)
  },

  /**
   * Return the cardId with cardCode removed
   */
  noCardCode(cardId) {
    if (cardId === null) return null
    const i = dig36.indexOf(cardId[0])
    const len = 1 + +regionLens[i] + +acctLens[i] + +agentLens[i]
    return cardId.substr(0, len)
  },
  
  mode() { 
    return location.href.startsWith(c.urls.production) ? 'production' 
    : location.href.startsWith(c.urls.staging) ? 'staging' 
    : location.href.includes('localhost') ? 'local' 
    : 'dev'
  }, 
  
  /**
   * Get financial information from the server for the current account.
   */
  async getInfo() {
    if (!u.st().showDash) return
    const me = u.st().me
    try {
      const params = {deviceId:me.deviceId, actorId:me.accountId, count:c.recentTxMax }
      const info = await u.postRequest('info', params)
      st.setBalance(+info.balance)
      st.setRecentTxs(info.txs)
      st.setGotInfo(true)
      //      balance, surtxs: {}, txs: [{xid, amount, accountId, name, description, created}, …]}
      //  where surtxs: {amount, portion, crumbs, roundup}
    } catch (er) { console.log('info er', er) }
  },

  st() { return st.inspect() },
  tx9() { return st().txs[st().txs.length - 1] },
  now() { return (u.testing()) ? u.st().now : u.now0() }, // keep "now" constant in tests
  fmtDate(dt) { return new Date(dt).toLocaleDateString('en-us', { year:'numeric', month:'numeric', day:'numeric'}) },
  realData() { return ['production', 'staging'].includes(u.mode()) },
  localMode() { return (u.mode() == 'local' && c.showDevStuff) }, 
  yesno(question, m1, m2) { u.dlg('Confirm', question, 'Yes, No', m1, m2) },
  alert(question, m1 = u.hide) { return u.dlg('Alert', question, 'OK', m1) },
  hide() { st.setModal(false) },
  crash(er) { console.log('crash', er); return typeof er === 'string' ? er : er.message },
  goEr(msg) { st.setMsg(msg); u.go('home') },
  goHome(msg) { st.setMsg(msg); u.go('home') },
  atHome(page = '') { return (page ? page : u.pageUri()) == 'home' },
  isTimeout(er) { return (typeof er === 'object' && (er.name == 'AbortError' || er.name == 'Offline')) },
  pageUri() { return location.href.substring(location.href.lastIndexOf('/') + 1) },
  isApple() { return /iPhone|iPod|iPad/i.test(navigator.userAgent) },
  isAndroid() { return !u.isApple() && /Android/i.test(navigator.userAgent) },
  go(page, setTrail = true) { 
    if (setTrail) st.setTrail(u.st()?.pending ? '' : u.pageUri())
    st.setPending(false) // must come after setTrail
    st.setLeft(u.atHome(page) ? 'logo' : 'back')
    navigateTo('/' + page)
  },
  goBack() { u.hide(); u.go(st.setTrail(), false) },

  isSafari() {
    const ua = navigator.userAgent
    return u.isApple() && /WebKit/i.test(ua) && !/CriOS/i.test(ua) && !/OPiOS/i.test(ua)
  },

  isChrome() {
    const ua = navigator.userAgent
    return /Chrome/i.test(ua) && !/Chromium/i.test(ua)
  },

  addableToHome() { 
    if (u.st().sawAdd) return false
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
          'authorization': `Bearer ${ u.st().me.deviceId }`,
          'Accept': 'application/json',
          'Content-type': 'application/json',
          body: JSON.stringify(tx)
  */
}

export default u
