// initial values for store

const cache = {
  sawAdd: false, // user pressed Continue on the Add-to-home-screen page
  qr: null, // scanned qr URL
  lastOp: null, // timestamp of last operation to timeout
  msg: null, // not yet used
  erMsg: null, // error message to display on Home page
  cameraCount: 0, // set this when scanning for the first time
  frontCamera: null, // set this in Root.svelte (can't be defaulted from tests)
  online: null, // true if app is online
  useWifi: true, // false if developer or test framework has disabled wifi
  selfServe: false, // self-serve mode

  choices: null, // accounts that user has permission to use in the app
  txs: [], // transactions waiting to be uploaded
  comments: [], // comments waiting to be uploaded

  corrupt: null, // timestamp that cached data got corrupted
  accts: {}, // keyed list of accounts that user has transacted with (or tried to)
  myAccount: null, // information about user's account, signed in

  // for testing
  posts: 0,
  enQ: 0,
  deQ: 0,
  flushOk: false,
  now: null, // static timestamp while testing
}

export default cache
