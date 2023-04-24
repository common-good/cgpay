/**
 * Data structure
 *
 * Data defined here is stored (persistently or transiently), and cached in "cache" while the app runs.
 * See also store.js
 * 
 * ARRAYS
 *    choices: a list (array) of Common Good accounts the signed-in user may choose to connect (one of) to the device
 *      accountId: the account ID including cardCode
 *      name: the name on the account
 *      qr: an image of the account’s QR code and ID photo (if any) for purchases
 *      isCo: true if the account is a company account
 *      selling: a list (array) of items for sale
 * 
 *    txs: transaction objects waiting to be uploaded to the server, each comprising:
 *      deviceId: a unique ID for the device associated with the actorId account
 *      amount: dollars to transfer from actorId to otherId (signed)
 *      actorId: the account initiating the transaction
 *      otherId: the other participant in the transaction
 *      description: the transaction description
 *      created: Unix timestamp when the transaction was created
 *      proof: the proof of the transaction -- a SHA256 hash of actorId, amount, otherId, cardCode, and created
 *        The amount has exactly two digits after the decimal point. For an Undo, proof contains the original amount.
 *      offline: true -- transactions completed offline are in the txs queue. All Undos are handled as though offline.
 *      version: the app's integer version number
 * 
 *    comments: user-submitted comments to be uploaded to the server
 *      created: Unix timestamp
 *      actorId: the account making the comment
 *      text: the comment
 * 
 * OBJECTS
 *    corrupt: version number when a transaction or comment upload fails inexplicably
 *    accts: an array of accounts the device has transacted with, keyed by the account ID without cardCode, each with:
 *      hash: SHA256 hash of cardCode
 *      name: name of the account
 *      agent: agent for the account, if any
 *      location: location of the account (city, ST)
 *      limit: maximum amount this account can be charged at this time (leaving room for Stepups)
 *      creditLine: the account's credit line
 *      avgBalance: the account’s average balance over the past 6 months
 *      trustRatio: ratio of the account’s trust rating to the average trust rating of all individual accounts (zero for company accounts)
 *      since: Unix timestamp of when the account was activated
 * 
 *    myAccount: information about the account associated with the device
 *      accountId, name, qr, isCo, and selling as in the choices array described above
 *      lastTx: Unixtime (in ms) of the last transaction known to this device (null if none)
 */

const cache = {
  persist: 'version deviceId sawAdd cameraCount frontCamera useWifi selfServe payOk choices txs comments corrupt accts myAccount',

  version: null, // latest app version that touched this data
  deviceId: null, // a unique identifier for the device (also identifies the device owner)
  sawAdd: null, // time user pressed Continue on the Add-to-home-screen page
  cameraCount: 0, // number of cameras in the device - set this when scanning for the first time
  frontCamera: null, // true to use front camera instead of rear (default false iff mobile) - set this in Root.svelte (can't be defaulted from tests)
  useWifi: true, // true to use wifi whenever possible (false if developer or test framework has disabled wifi)
  selfServe: false, // true for self-serve mode
  payOk: 'always', // payments from this device are permitted: always, scan, or never - default for companies is scan (self-scan-in required, to pay)

  choices: null, // accounts that user has permission to use in the app
  txs: [], // transactions waiting to be uploaded
  comments: [], // comments waiting to be uploaded

  deviceIds: {}, // list of deviceIds keyed by accountId
  corrupt: null, // timestamp that cached data got corrupted
  accts: {}, // keyed list of accounts that user has transacted with (or tried to)
  myAccount: null, // information about user's account, signed in

  // transient data (not stored in local storage)
  token: null, // session token (a stand-in for the deviceId in GET requests)
  timeout: null, // milliseconds before inactivity timeout (for return to Home Page)
  qr: null, // (blob) a scanned QR url
  intent: null, // what to do on the next page: scanIn, pay, or charge
  msg: null, // an informational message to display on the Home Page (not yet used)
  erMsg: null, // error message to display on Home page
  online: null, // true if the device is connected to the Internet
  coPaying: false, // true if a company account is toggled to pay, refund, or sell CG credit (vs charge) - times out

  // for testing
  posts: 0, // operation counters for calls to u.postRequest, enQ, and deQ
  enQ: 0,
  deQ: 0,
  flushOk: false, // true if the tester is ready for queued transactions and comments to be uploaded to the server 
  now: null, // a stable timestamp (in seconds) for each Scenario
}

export default cache
