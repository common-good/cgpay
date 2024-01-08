/**
 * Handle data storage and retrieval.
 * This may want to use an actual database someday. For now we use localStorage and sessionStorage.
 */

import u from '#utils.js'
import cache0 from '#cache.js'
import c from '#constants.js'

export function getst() { return {
    ...JSON.parse(localStorage.getItem(c.storeKey)),
    ...JSON.parse(sessionStorage.getItem(c.storeKey)),
  }}

  /**
   * Save the given data set variously in (persistent) localStorage or in sessionStorage, as appropriate.
   * @param {*} s: the entire data set to save
   * @param string k: key to the data being updated
   * @param string persist: space-delimited list of data keys to persist (save in localStorage) -- otherwise save in sessionStorage
   */
export function save(s, k = '', persist = cache0.persist) { // allow saving of previous release data when testing: eg w persist=Object.keys(s).join(' '))
    if (k == '' || u.in(k, persist)) saveA(localStorage, u.just, persist, s)
    if (k == '' || !u.in(k, persist)) saveA(sessionStorage, u.justNot, persist, s)
    return { ...s }
  }

/**
 * Save the data subset in the given pot (localStorage or sessionStorage). 
 * If we're running low on storage, delete some old customer records. If that doesn't help, trigger a failure error message.
 */
function saveA(pot, subset, persist, s) {
  let data, ok
  do {
    data = JSON.stringify(subset(persist, s))
    ok = saveSuccess(pot, data)
  } while (!ok && u.in('txs', persist) && moreAccts(s)) // navigator.storage.quota/.usage is irrelevant

  if (!ok) u.goEr('Out of storage!')
}

function saveSuccess(pot, data) {
  try {
    pot.setItem(c.storeKey, data) // let this throw a storage error
    return true
  } catch (er) { return false }
}

/**
 * Delete the oldest item from st.accts, to free up a little storage space.
 */
function moreAccts(s) { 
  if (Object.keys(s.accts).length < 2) return false
  delete s.accts[Object.keys(s.accts)[0]]
  return true
}
