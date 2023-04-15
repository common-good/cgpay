import { assert, expect } from 'chai'
import c from '../../constants.js'
import u from '../../utils0.js'
import cache from '../../src/cache.js'
import w from './world.js'
import queryString from 'query-string'

const baseUrl = 'http://localhost:' + c.port + '/'

const t = {
  // Constants
  ONE: true, // parameter for these()
  SERVER: true, // parameter for these()

  // UTILITY FUNCTIONS

  getst(key = c.storeKey) { return JSON.parse(localStorage.getItem(key)) }, // for debugging
  async snap(picName = 'snap') { await w.page.screenshot({ path:picName + '.png' }) }, // screen capture
  async wait(secs) { await w.page.waitForTimeout(secs * 1000) },
  mapServerField(field) { return field == 'actorId' ? 'actorUid' : field }, // disambiguate server's from app's actorId field

  async whatPage() { 
    const el = await w.page.$('.page')
    try {
      return el ? await w.page.$eval( '.page', el => getAttribute('data-testid') ) : null
    } catch (er) {
      console.log('Page has no .page element')
      return 'UNKNOWN PAGE'
    }
  },

  /**
   * Get all stored values (the storage state)
   * @returns {*} st: an object containing all the app's stored values
   */
  async getStore(key = c.storeKey) {
    const localStorage = await w.page.evaluate(() =>  Object.assign({}, window.localStorage))
    return JSON.parse(localStorage[key])
  },

  async putStore(st, key = c.storeKey) {
    if (u.empty(st)) st = {}
    st = JSON.stringify(st)
    await w.page.evaluate((k, v) => { localStorage.setItem(k, v) }, key, st)
    await t.waitACycle() // give the network timeout function time to reload the store
  },

  async getv(k) {
    const st = await t.getStore()
    return st ? st[k] : null
  },

  async putv(k, v) {
    let st = await t.getStore()
    if (u.empty(st)) st = { ...cache }
    st.fromTester[k] = st[k] = v
    if (k == 'online') st.fromTester.useWifi = st.useWifi = v // these values go together for faking online/offline
    await t.putStore(st)
    w.tellApp = true
  },

  /**
   * This function is exposed to the app by the "page.exposeFunction" function in BeforeAll() (see in hooks.js).
   * It is used for communication (one way at a time) between this testing framework and the app (through its u.testerPipe function)
   * @param string k: key to add to w or operation
   * @param {*} v: value to store in w or operation details
   * @returns true if there is data waiting for the app to store (see t.putv() and store.fromTester())
   */
  async appPipe(k = null, v = null) {
    if (k) { w[k].push(v); return false }

    const res = w.tellApp
    w.tellApp = false
    return res
  },
  
  /**
   * For an array of n arrays, the first element being the keys (from a Gherkin multi-value field), return an array of n-1 objects.
   * @param {*} rows: a list of field names and one or more data records
   * @param bool one: if true, return just the first/only record
   * @param bool serverField: if true, the rows represent data expected from the server
   */
  these({ rawTable:rows }, one = null, serverField = null ) {
    if (rows.length === 1) return [ t.adjust(rows[0][0]) ]
    if (one) assert.equal(rows.length, 2)
    let ray = [] // the resulting array of objects
    let obo  // original object before adjustments (current row)
    let k // current field name
    
    for (let rowi = 0; rowi < rows.length - 1; rowi++) {
      ray[rowi] = {}; obo = {} // don't combine these
      for (let coli in rows[0]) {
        k = rows[0][coli]
        obo[k] = rows[rowi + 1][coli] // remember original value of this cell
        if (k == 'proof') w.proofRow = { ...ray[rowi], amount:obo.amount.replace('-', ''), cardCode:t.adjust(obo.otherId, 'cardCode') } // save this for calculating the wanted proof value in adjust
        ray[rowi][k] = t.adjust(obo[k], serverField ? t.mapServerField(k) : k)
      }
    }
    return u.clone(one ? ray[0] : ray)
  },

  /**
   * Return value with adjustments for special parameters
   * @param string v: value to adjust
   * @param string k: field name (to inform the adjustment)
   */
  adjust(v, k) {
    const v0 = typeof v === 'string' ? v.charAt(0) : ''

    if (v === null) return null
    if (v == 'null') return null
    if (v == 'true') return true
    if (v == 'false') return false
    if (v == 'now') return u.now()
    if (v == 'version') return c.version
    if (v0 == '!') return '!' + t.adjust(v.substring(1), k)
    if (v0 == '[' || v0 == '{') return u.parseObjString(v)
    if (v == 'other') return 'garbage' // this even works for k='qr'

    if (k == 'proof' && v == 'hash') {
      const proof = 'actorId/amount/otherId/cardCode/created'.split('/')
      let res = ''
      for (let fld of proof) res += w.proofRow[fld] // the individual fields in proof are tested separately
      return u.hash(res)
    }

    const me = u.clone(w.accounts[v])
    if (me != null) return  (k == 'account') ? me
                          : ('actorUid uid1 uid2 agt1 agt2'.split(' ').includes(k) ? w.uid(v)
                          : (k == 'myAccount' ? u.just('name isCo accountId deviceId selling', me)
                          : (k == 'actorId' ? me.accountId
                          : (k == 'otherId' ? me.accountId
                          : (k == 'cardCode' ? me.cardCode
                          : (k == 'qr' ? c.testQrStart + me.accountId.charAt(0) + me.accountId.substring(4) + me.cardCode
                          : v ))))))
    return v
  },

  /**
   * Test whether what we got equals (or sort of equals) what we wanted.
   * If mode is not specified, time fields are compared loosely (within a couple seconds)
   * @param {*} got 
   * @param {*} want: what is wanted (recurses if want is an object)
   * @param string field: name of field being tested (to inform substitutions)
   * @param string mode: exact (default), false (exact not), part, or <n (meaning got and want are less than n apart) 
   */
  test(got, want, field = null, mode = null) {
    if (typeof want === 'string' && '{['.includes(want.charAt(0)) && want !== '') want = u.parseObjString(want)
    const msg = `got: \`${JSON.stringify(got)}\` wanted: \`${JSON.stringify(want)}\` mode: \`${mode}\``

    if (typeof want === 'object') {
      assert.equal(typeof got, 'object', msg) // do this before empty test
      if (u.empty(want)) {
        assert.deepStrictEqual(got, want, msg)
      } else if (Array.isArray(want)) { // array
        assert.isTrue(Array.isArray(got), msg)
        assert.equal(got.length, want.length, msg)
        for (let i in want) t.test(got[i], want[i], i, mode)
      } else { // object
        if (field == 'myAccount') want = { ...want, deviceId:'?', qr:'?' }
        let modei
        for (let i of Object.keys(want)) {
          modei = u.empty(mode) ? (t.isTimeField(i) ? '<' + w.timeSlop : null) : mode
          t.test(got[i], want[i], i, modei)
        }
      }
      return
    }

    if (want == '?') return // anything is acceptable
    if (typeof want === 'string' && want.charAt(0) == '!') return test(got, want.substring(1), field, false)

    want = t.adjust(want, field)
    const [jGot, jWant] = [JSON.stringify(got), JSON.stringify(want)]

    if (mode === false) {
      assert.notEqual(jGot, jWant, msg + ' - NOT')
    } else if (mode == 'exact' || mode === null) {
      if (!isNaN(got)) got = +got
      if (!isNaN(want)) want = +want
      assert.equal(got, want, msg)
    } else if (mode == 'part') {
      assert.include(got, want, msg)
    } else if (mode.charAt(0) == '<') {
      assert.isBelow(Math.abs(got - want), +mode.substring(1), msg)
    } else assert.fail('bad mode:' + mode)
  },

  async element(testId) { return await w.page.$(t.sel(testId)) },
  sel(testId) { return `[data-testid="${testId}"]` },
  isTimeField(k) { return 'created'.split(' ').includes(k) },
  async waitACycle() { return w.page.waitForTimeout(c.networkTimeoutMs + 1) },
  
  // MAKE / DO

  async visit(target, wait = 'networkidle0') { 
    const options = wait ? { waitUntil:wait } : {} // load, domcontentloaded, networkidle0, or networkidle2
    await w.page.goto(baseUrl + target, options)
  },

  /**
   * Initialize an array or object
   * @param string k: key to value in store to store 
   * @param {*} v: value or gherkin array of arrays representing records to store
   *               for an array, first row is a list of field names, subsequent rows are the field values
   * @param bool one: true to store just the first record rather than an array of records
   */
  async setThis(k, v, one = false) {
    await t.putv(k, t.adjust(typeof v === 'string' ? v : t.these(v, one), k))
  },

  async setUA(browser, sys) {
    let agent = ''
    if (sys == 'Apple' && browser == 'Safari') agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/36.0  Mobile/15E148 Safari/605.1.15'
    if (sys == 'Android' && browser == 'Chrome') agent = 'Mozilla/5.0 (Linux; Android 11; SM-T227U Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Safari/537.36'
    await w.page.setUserAgent(agent)
  },

  async input(id, text) {
    const sel = t.sel('input-' + id) 
    await w.page.click(sel, { clickCount: 3 }) // select field so that typing replaces it
    await w.page.type(sel, isNaN(text) ? text : JSON.stringify(text))
    const newValue = await w.page.$eval(sel, el => el.value)
    t.test(newValue, text)
  },

  async scan(who) { await t.putv('qr', t.adjust(who, 'qr')); await t.visit('charge') },
  async tx(who, amount, description) {
    await t.scan(who)
    await t.input('amount', amount)
    await t.input('description', description)
    await w.page.click(t.sel('btn-submit'))
  },

/**
 * Post to the "test" endpoint.
 * @param string op: the specific operation
 * @param {*} args: parameters to that operation
 * @returns a JSON object just like other POST endpoints
 */
async postToTestEndpoint(op, args = null) {
  const options = {
    method: 'POST',
    body: queryString.stringify({ version:c.version, op:op, ...args }),
    headers: { 'Content-type':'application/x-www-form-urlencoded' },
  }
  try { // initialize API for tests (must happen before initializing store)
    return await t.mockFetch(c.apis.test + 'test', options)
  } catch (er) { console.log(`error posting to test endpoint "${c.apis.test}test" with options ${options}`, er) }  
},

/**
 * Mock fetches or use the "test" endpoint (see postToTestEndpoint). Interface matches JS fetch interface.
 * NOTE: Making API calls when this function was called as a mock fetch did not work (no connection to internet?)
 * @param string url 
 * @param {*} options 
 * @returns the result
 */
async mockFetch(url, options = {}) {
  options = { ...options, mode:'cors', postData:options.body }
  const keysToDelete = 'signal body'.split(' ')
  for (let i in keysToDelete) delete options[keysToDelete[i]]

  await w.fetcher.setRequestInterception(true)
  await w.fetcher.once('request', async (interceptedRequest ) => {
    try {
      interceptedRequest.continue(options)
    } catch (er) { console.log('Error while intercepting request', er) }
  })
  let res
  try {
    res = await w.fetcher.goto(url)
    if (res.ok()) res = await res.json()
  } catch (er) { console.log(`Error while mock fetching "${url}" with options ${options}`, er)}
  await w.fetcher.setRequestInterception(false)
  return res
},

  // TEST

  /**
   * Compare stored records we have with what was expected.
   * @param string k: key to value in store to test
   * @param {*} multi: gherkin array of arrays representing records to store
   *                   first row is a list of field names, subsequent rows are the field values
   * @param bool one: true to test just the first record rather than an array of records
   */
  async testThese(k, multi, one = false) {
    t.test(await t.getv(k), t.these(multi, one))
  },

  async testThis(k, v) {
    if (typeof v === 'object') return t.testThese(k, v, t.ONE)
    t.test(await t.getv(k), v, k)
  },

  async testServer(table, rows) {
    const want = t.these(rows, false, t.SERVER)
    let msg, kvs, i
    const got = await t.postToTestEndpoint('rows', { fieldList:'*', table:table })
    for (let rowi in want) {
      kvs = table == 'txs' ? { amt:want[rowi].amt, for2:want[rowi].for2 } : { none:0 }
      msg = `want server ${table} row (${rowi}) with ` + JSON.stringify(kvs)
      i = u.findByValue(got, kvs)
      assert.isNotNull(i, msg)
      t.test(got[i], want[rowi])
    }
  },

  async posted(endpoint, rows, method) {
    await t.waitACycle()
    w.posti = u.findByValue(w.post, { endpoint:endpoint })
    assert.isNotNull(w.posti, `expected a "${method}" request to endpoint "${endpoint}"`)
    t.test({ ...w.post[w.posti] }, { endpoint:endpoint, v:t.these(rows, t.ONE), method:method } )
    delete w.post[w.posti]
  },

  /**
   * Set or compare accts[] or choices[] in the store to the expected list.
   * Confirm only that the key, agent, and name of each entry are as expected.
   * @param string field: which field - accts or choices
   * @param {*} row: a single row/list of account identifiers
   * @param bool set: true if setting the value
   */
  async theseAccts(field, { rawTable:row }, set = false) {
    let got, me, name, agent
    let want = row[0]
    let make = field == 'accts' ? {} : []

    if (!set) {
       got = await t.getv(field)
      assert.isNotNull(got, `missing ${field} array in store`) // accts has no length, so it might have extra accounts, which is fine
    }

    for (let i in want) {
      me = w.accounts[want[i]]
      if (me === null) me = u.parseObjString(want[i])
      if (field == 'accts') {
        ;([agent, name] = want[i].includes('/') ? want[i].split('/') : ['', me.name])
        if (set) {
          make[me.accountId] = { hash:u.hash(me.cardCode), agent:agent, name:name, location:me.location, limit:200, creditLine:9999 }
        } else t.test(u.just('agent name', got[me.accountId]), { agent:agent, name:name }, field)
      } else { // choices
        if (set) {
          make.push(u.just('name accountId deviceId qr isCo selling', me))
        } else t.test(u.just('name accountId isCo selling', got[i]), u.just('name accountId isCo selling', me), field)
      }
    }
    if (set) await t.putv(field, make) // make is an object or array
  },

  async onPage(id) {
    const el = await w.page.$(`#${id}`)
    if (el === null) {
      const here = await t.whatPage()
      assert.isNotNull(el, `page "${id}" not found. You are on page "${here}"`)
    }
  },

  async see(testId) {
    const el = await t.element(testId)
    assert.isNotNull(el)
    return el // this is required (I don't know why)
  },

  async seeIs(testId, want, mode = 'exact') {
    const gotEl = await t.see(testId)
    const got = await gotEl.evaluate(el => el.textContent)
    t.test(got, want, null, mode)
  },

  async dontSee(testId) { assert.isNull(await t.element(testId), "shouldn't see" + testId) },

  async countIs(list, count) {
    const ray = await t.getv(list)
    assert.equal(ray.length, count, `want list ${list} count=${count}`)
  },

  async signedInAs(who, set = false) {
    const me = w.accounts[who]
    if (set) await t.putv('myAccount', { ...u.just('name isCo accountId deviceId selling', me), qr:'qr' + me.name.charAt(0) })
    if (!set) t.test(u.just('name isCo accountId selling', await t.getv('myAccount')), u.just('name isCo accountId selling', me), 'myAccount')
  },

}

export default t
