// Utilities shared between app and tests (namespace u in both, since this is included in utils.js)
import { sha256 } from 'js-sha256'

const u = {
  hash(s) {
    const hash = sha256.create()
    hash.update(s)
    return hash.hex()
  },

  just(which, obj) { // subset of object
    let res = {}; for (let k of u.ray(which)) res[k] = obj[k]
    return res
  },
  justNot(which, obj) {
    let res = { ...obj }
    for (let k of u.ray(which)) delete res[k]
    return res
  },

  now0() { return Math.floor(Date.now() / 1000) },
  async sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }, // sleep for that many milliseconds
  clone(v) { return u.empty(v) ? v: JSON.parse(JSON.stringify(v)) }, // deep clone (assumes object contains just objects, numbers, and strings)
  ray(s) { return s.split(s.includes(', ') ? ', ' : (s.includes(',') ? ',' : ' ')) }, // express an array as a space or comma-delimited string list

  emptyObj(obj) { return obj === null || (typeof obj === 'object' && Object.keys(obj).length == 0) },
  empty(s) { return (s === null || s === undefined || s === '' || s === 0 || u.emptyObj(s)) },
  er(msg, details = null) { return { name:msg, message:u.empty(details) ? msg : details } },
  parseObjString(objString) { // perversely, JS cannot evaluate an object literal without a wrapper
    if (!'[{'.includes(objString.charAt(0))) throw new Error('Invalid object string')
    return eval(`[${objString}]`)[0]
  },
  fmtVersion(n) { n = n.toString(); return n.substring(0, 1) + '.' + n.substring(2, 3) + '.' + n.substring(3, 4) },

  /**
   * Return Find the object, in a list of objects, that has a given keyed value.
   * @param {*} obj: the object (or array) to search
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

  in(k, ks) { return ks.split(' ').includes(k) },
  withCommas(num) { 
    let withCommas = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') 
    const i = withCommas.indexOf('.');
    return (i && withCommas.slice(i + 1).length < 2) ? withCommas += '0' : withCommas;
  },
  testing() { return (typeof window !== 'undefined' && typeof window.testerPipe === 'function') },
  async tellTester(op, k = null, v = null) { return u.testing() ? await window.testerPipe(op, k, v) : null },

  /**
   * Count UTF-8 bytes of a string, assuming the string is UCS-2 (aka UTF-16) encoded
   * from fuweichin at https://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript (the most efficient for large strings)
   * except we overstate the length on error, instead of throwing an error
   */
  byteLen(s) {
    var n=0
    for (var i=0, len=s.length; i<len; i++) {
      var hi = s.charCodeAt(i)
      if (hi<0x0080) { //[0x0000, 0x007F]
        n+=1
      } else if (hi<0x0800) { //[0x0080, 0x07FF]
        n+=2
      } else if (hi<0xD800) { //[0x0800, 0xD7FF]
        n+=3
      } else if (hi<0xDC00) { //[0xD800, 0xDBFF]
        var lo=s.charCodeAt(++i)
        if (i<len && lo>=0xDC00 && lo<=0xDFFF) { //followed by [0xDC00, 0xDFFF]
          n+=4
        } else {
          n+=5 // (never throw an error) throw new Error("UCS-2 String malformed")
        }
      } else if(hi<0xE000) { //[0xDC00, 0xDFFF]
        n+=6 //  (never throw an error) throw new Error("UCS-2 String malformed");
      } else { //[0xE000, 0xFFFF]
        n+=3
      }
    }
    return n
  },

}

export default u
