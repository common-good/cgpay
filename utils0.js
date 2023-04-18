// Utilities shared between app and tests (namespace u in both, since this is included in utils.js)
import { sha256 } from 'js-sha256'

const u = {
  hash(s) {
    const hash = sha256.create()
    hash.update(s)
    return hash.hex()
  },

  just(which, obj) { // subset of object
    const ks = which.split(' ')
    let res = {}
    for (let i in ks) res[ks[i]] = obj[ks[i]]
    return res
  },

  now() { return Math.floor(Date.now() / 1000) },
  clone(v) { return u.empty(v) ? v: JSON.parse(JSON.stringify(v)) }, // deep clone (assumes object contains just objects, numbers, and strings)
  ray(s) { return s.split(s.includes(', ') ? ', ' : (s.includes(',') ? ',' : ' ')) }, // express an array as a space or comma-delimited string list

  emptyObj(obj) { return obj === null || (typeof obj === 'object' && Object.keys(obj).length == 0) },
  empty(s) { return (s === null || s === undefined || s === '' || s === 0 || u.emptyObj(s)) },
  er(msg, details = null) { return { name:msg, message:u.empty(details) ? msg : details } },
  parseObjString(objString) { // perversely, JS cannot evaluate an object literal without a wrapper
    if (!'[{'.includes(objString.charAt(0))) throw new Error('Invalid object string')
    return eval(`[${objString}]`)[0]
  },

  /**
   * Return Find the object, in a list of objects, that has a given keyed value.
   * @param {*} obj: the object to search
   * @param {*} kvs: keyed values to find
   * @return index to the found object (or null)
   */
  findByValue(obj, kvs) {
    let k
    outer: for (let i in obj) {
      for (k in kvs) if (obj[i][k] != kvs[k]) continue outer
      return i
    }
    return null
  },

  withCommas(num) { return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') },

}

export default u
