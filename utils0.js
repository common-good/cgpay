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
  clone(v) { return JSON.parse(JSON.stringify(v)) }, // deep clone (assumes object contains just objects, numbers, and strings)

}

export default u
