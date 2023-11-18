import { assert, expect } from 'chai'
import c from '../../constants.js'
import u from '../../utils0.js'
import cache from '../../src/cache.js'
import cacheA from './oldData/cacheA.js'
import w from './world.js'
import queryString from 'query-string'

const baseUrl = 'http://localhost:' + c.port + '/'

const t = {
  // Constants
  ONE: true, // parameter for these()

  // UTILITY FUNCTIONS

  getst(key = c.storeKey) { return JSON.parse(localStorage.getItem(key)) }, // for debugging
  async snap(picName = 'snap') { await w.page.screenshot({ path:picName + '.png' }) }, // screen capture
  async wait(secs) { await w.page.waitForTimeout(secs * 1000) },

  /**
   * Translate app's table and field names to server's
   * @param string field: table or field name 
   * @param string table: table name, if relevant
   * @returns the translated field name
   */
  mapToServer(field, table = null) {
    // table names
    return field == 'accounts' ? 'users'

    // field names
    : (table == 'users' && 'id actorId'.split(' ').includes(field)) ? 'uid' // maybe use just id?
    : (table == 'users' && field == 'actorId') ? 'uid'
    : (table == 'txs' && field == 'actorId') ? 'actorUid'
    : field == 'creditLine' ? 'floor'
    : field
  },

  async whatPage() { 
    try {
      return await w.page.$eval( '.page', el => el.getAttribute('id') )
    } catch (er) {
      console.log('Page has no .page element')
      return 'UNKNOWN PAGE'
    }
  },

  /* UNUSED, but keep this arround (we may need it)
  async putStore(st, key = c.storeKey) {
    if (u.empty(st)) st = {}
    w.store = st
    st = JSON.stringify(st)
    await w.page.evaluate((k, v) => { localStorage.setItem(k, v) }, key, st)
    await t.waitACycle() // give the network timeout function time to reload the store
  },
  */

  async getv(k) { return w.store[k] },

  async putv(k, v) {
    w.store[k] = v
    if (k == 'online') { w.store.useWifi = v } // these values go together for faking online/offline
    await t.tellApp(k, v)
  },

  /**
   * This function is exposed to the app by the "page.exposeFunction" function in Before() in hooks.js).
   * It is used for communication (one way at a time) between this testing framework and the app using u.tellTester()
   * w.tellApp is set to null while the app is working on something at the test framework's (our) request
   * @param string op: the operation to be performed by the tester (notified/requested by the app)
   * @param string k: key to store in w or localStore
   * @param {*} v: value operation details
   * @returns an array of key/value pairs waiting for the app to store (see t.putv() and st.fromTester())
   */
  async appPipe(op = null, k = null, v = null) {
    if (op == 'store') {
      w.store[k] = v

    } else if (op == 'post' || op == 'get') {
      w[op][k] = v

    } else if (op == 'done') { // app has finished handling our instructions
      w.tellApp = {} // signal to t.tellApp that handling is done

    } else if (op == 'tellme') { // app is ready for instructions, tell it whatever is in w.tellApp
      if (u.empty(w.tellApp)) return null
      const res = u.clone(w.tellApp)
      w.tellApp = null // signal to t.tellApp that handling has begun
      return res

    } else assert.fail('invalid appPipe op: ' + op)
  },

  /**
   * For an array of n arrays, the first element being the keys (from a Gherkin multi-value field), return an array of n-1 objects.
   * @param {*} rows: a list of field names and one or more data records
   * @param bool one: if true, return just the first/only record
   * @param bool serverTable: if specified, the rows represent data expected from (or sent to) the server
   */
  these({ rawTable:rows }, one = false, serverTable = null ) {
    if (rows.length === 1) return [ t.adjust(rows[0][0]) ]
    if (one) assert.equal(rows.length, 2)
    let ray = [] // the resulting array of objects
    let obo  // original object before adjustments (current row)
    let k // current field name
    
    for (let rowi = 0; rowi < rows.length - 1; rowi++) {
      ray[rowi] = {}; obo = {} // don't combine these
      for (let coli in rows[0]) {
        k = rows[0][coli]
        if (serverTable) k = t.mapToServer(k, serverTable)
        obo[k] = rows[rowi + 1][coli] // remember original value of this cell
        if (k == 'proof') w.proofRow = { ...ray[rowi], amount:obo.amount.replace('-', ''), cardCode:t.adjust(obo.otherId, 'cardCode') } // save this for calculating the wanted proof value in adjust
        ray[rowi][k] = t.adjust(obo[k], serverTable ? t.mapToServer(k, serverTable) : k)
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
    if (v == 'now') return w.now
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
                          : k == 'me' ? u.just('name isCo accountId deviceId selling', me)
                          : u.in(k, 'actorUid uid uid1 uid2 agt1 agt2') ? w.uid(v)
                          : k == ('id' && v.includes('/')) ? v.split('/')[1] // without agent
                          : k == 'actorId' ? me.accountId
                          : k == 'otherId' ? me.accountId
                          : k == 'cardCode' ? me.cardCode
                          : k == 'deviceId' ? me.deviceId
                          : k == 'qr' ? c.testQrStart + me.accountId.charAt(0) + me.accountId.substring(4) + me.cardCode
                          : v 
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
        if (field == 'me') want = { ...want, deviceId:'?', qr:'?' }
        for (let i of Object.keys(want)) t.test(got[i], want[i], i, u.empty(mode) ? null : mode)
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
  isTimeField(k) { return u.in(k, 'created') },
  async waitACycle(n = 1) { return w.page.waitForTimeout(n * c.networkTimeoutMs + 1) },
  
  // MAKE / DO

  async click(testId, options = {}) { await w.page.click(t.sel(testId), options) }, // sometimes takes a moment

  /**
   * Tell the app to do something (when it next asks for instructions)
   */
  async tellApp(k, v) {
    w.tellApp = { [k]:v } // [k] means evaluate k (it doesn't mean the key is an array)
    while (!u.empty(w.tellApp)) await t.waitACycle() // wait for app to ask for these instructions -- w.tellApp gets set to null ({} if complete)
    while (w.tellApp === null) await t.waitACycle() // wait for app to handle instructions (w.tellApp gets set to {})
  },

  /**
   * Set typical data (possibly from a previous release)
   * @param string release: semantic version number of old data (defaults to current version)
   * NOTE: If release is specified, it should be called from the first step in a scenario (including any background)
   */
  async setStore(release = null) {
    if (release != null) w.store = u.clone(
      release == 'A' ? cacheA : 'error'
    )
    w.store.now = w.now
    await t.tellApp('clear', { ...w.store })
  },

  async visit(target, wait = 'networkidle0') { 
    const options = wait ? { waitUntil:wait } : {} // load, domcontentloaded, networkidle0, or networkidle2
    await w.page.goto(baseUrl + target, options)
  },

  async go(target, from = 'home') { // simulate u.go() when no click is available (just from the scan page for now)
    let trail = []
    if (target != 'home') {
      trail = await t.getv('trail')
      trail.push(from) // we can't actually u.go anywhere from the scan page in testing, so these 5 lines fake it
    }
    await t.putv('trail', trail)
    await t.putv('hdrLeft', target == 'home' ? 'logo' : 'back')
    await t.visit(target)
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

  /**
   * Set record values on the server
   * @param string table: app's name for the server table to update
   * @param {*} rows: a list of tables/record IDs/field values to set on the server
   */
  async setServer(table, rows) {
    const serverTable = t.mapToServer(table)
    const ray = t.these(rows, false, serverTable)
    if ('floor' in ray[0]) for (let i in ray) ray[i].floor = -ray[i].floor // translation from "creditLine" changes sign
    await t.postToTestEndpoint('update', { table:serverTable, keyedValues:JSON.stringify(ray) })
  },

  async setUA(browser, sys) {
    let agent = ''
    if (sys == 'Apple' && browser == 'Safari') agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/36.0  Mobile/15E148 Safari/605.1.15'
    if (sys == 'Android' && browser == 'Chrome') agent = 'Mozilla/5.0 (Linux; Android 11; SM-T227U Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Safari/537.36'
    await w.page.setUserAgent(agent)
  },

  async input(id, text) {
    const testId = 'input-' + id
    const sel = t.sel(testId) 
    t.wait(2) // required by 2023 Chrome :(
    await t.click(testId, { clickCount: 3 }) // select field so that typing replaces it
    await w.page.type(sel, isNaN(text) ? text : JSON.stringify(text))
    await t.waitACycle(2) // needed sometimes between inputs
    const newValue = await w.page.$eval(sel, el => el.value)
    t.test(newValue, text)
  },

  async scan(who, why = 'charge') {
    const qr = t.adjust(who, 'qr');
    await t.putv('intent', why)

    if (why == 'scanIn') {
      await t.putv('qr', qr) // must be after visit to Home page (because it resets qr)
      await t.go('scan')
      await t.go('home')

    } else { // why is charge or pay (assume we're on home page)
      await t.visit('') // scan is sometimes called directly (not from tx(), so we need this here)
      await t.onPage('home') // make sure we're starting in the right place
      if (w.store.showDash) { // an extra click if home page shows Dashboard
        await t.click('btn-' + why)
        why = 'scan'
      }
      await t.putv('qr', qr) // must be after visit to Home page (because it resets qr)
      await t.click('btn-' + why)
      await t.waitACycle(3)
      await t.onPage('scan') // make sure the button worked
      await t.go('tx', 'scan')
    }
  },

  async tx(who, amount, description) {
    await t.scan(who, amount < 0 ? 'pay' : 'charge') // scan for pay or charge starts by going home, so no need to do that here
    await t.input('amount', Math.abs(amount))
    await t.input('description', description)
    await t.click('btn-submit')
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
  for (let k of u.ray('signal body')) delete options[k]

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
    const want = t.these(rows, false, table)
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

  /**
   * Test just the most recent post or get to the given endpoint
   * @param {*} endpoint 
   * @param {*} rows 
   * @param {*} method 
   */
  async posted(endpoint, rows, method) {
    assert.isNotNull(w[method][endpoint], `expected a "${method}" request to endpoint "${endpoint}"`)
    t.test({ ...w[method][endpoint] }, t.these(rows, t.ONE) )
    delete w[method][endpoint]
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
          make.push(u.just('name accountId cardCode deviceId qr isCo selling', me))
        } else t.test(u.just('name accountId cardCode isCo selling', got[i]), u.just('name accountId cardCode isCo selling', me), field)
      }
    }
    if (set) await t.putv(field, make) // make is an object or array
  },

  async onPage(id) {
    const here = await t.whatPage()
    assert.equal(here, id, `page "${id}" not found. You are on page "${here}"`)
  },

  async see(testId) {
    const el = await t.element(testId)
    assert.isNotNull(el)
    return el
  },

  /**
   * Test the value of a DOM element
   * @param string testId: element ID 
   * @param string want: value wanted 
   * @param string mode: exact (default), false (exact not), part, or <n (meaning got and want are less than n apart) 
   * @returns 
   */
  async elementIs(testId, want, mode = 'exact') {
    const prefix = testId.split('-')[0]
    const el = await t.see(testId)
    if (u.in(want, 'selected checked')) { // Svelte doesn't use selected and checked so we simulate it with class
      const has = (await (await el.getProperty('className')).jsonValue()).split(' ').includes(want)
      return assert.isTrue(mode === false ? !has : has)
    }
    let got = await el.evaluate(el0 => el0.textContent)
    if (prefix == 'input') got = await (await el.getProperty('value')).jsonValue()
    t.test(got, want, null, mode)
  },

  async dontSee(testId) { assert.isNull(await t.element(testId), "shouldn't see " + testId) },

  async countIs(list, count) {
    const ray = await t.getv(list)
    assert.equal(ray.length, count, `want list ${list} count=${count}`)
  },

  async signedInAs(who, set = false) {
    const me = w.accounts[who]
    if (set) {
      await t.putv('me', { ...u.just('name isCo accountId cardCode deviceId selling', me), qr:'qr' + me.name.charAt(0) })
      await t.putv('showDash', !me.isCo)
      await t.putv('allowShow', !me.isCo)
    } else t.test(u.just('name isCo accountId cardCode selling', await t.getv('me')), u.just('name isCo accountId cardCode selling', me), 'me')
  },

}

export default t
