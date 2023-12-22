// initial values for conversion tests

const cache = {
  persist: 'version sawAdd cameraCount frontCamera locked selfServe payOk allowType allowShow showDash balance choices recentTxs txs comments confirms deviceIds corrupt accts me',
  reset: 'balance showSettings locked selfServe payOk allowType allowShow showDash balance recentTxs me token timeout qr msg erMsg coPaying hdrLeft pending modal gotInfo',

  version: null, // latest app version that touched this data (an integer with two digits representing each segment of x.y.z)
  corrupt: null, // timestamp to retry uploading corrupted cached data
  sawAdd: null, // time user pressed Continue on the Add-to-home-screen page
  balance: '...', // last known balance
  cameraCount: 0, // number of cameras in the device - set this when scanning for the first time

  // persistent parameters that can be changed by user in Settings
  showSettings: false,
  frontCamera: null, // true to use front camera instead of rear (default false iff mobile) - set this in Root.svelte (can't be defaulted from tests)
  locked: false, // require sign-in to change accounts or settings
  selfServe: false, // true for self-serve mode
  payOk: 'always', // payments from this device are permitted: always, scan, or never - default for companies is scan (self-scan-in required, to pay)
  allowType: false, // allow type-to-pay and type-to-charge (should default true)
  allowShow: false, // all show-to-pay and show-to-charge
  showDash: null, // true to show dashboard (balance, recent txs, ...) on home page (set when linking account)
  // maybe eventually store some settings (like balance and showDash) in choices or deviceIds so they persist when user changes account

  choices: null, // accounts the user has permission to use in the app
  recentTxs: [], // list of current account's most recent transactions
  txs: [], // transactions waiting to be uploaded
  comments: [], // comments waiting to be uploaded
  confirms: [], // transaction confirmations/denials waiting to be uploaded

  deviceIds: {}, // list of deviceIds keyed by accountId
  accts: {}, // keyed list of accounts that user has transacted with (or tried to)
  me: {
    "accountId": "K6VMDCA",
    "cardCode": "12345a",
    "name": "Abe One",
    "deviceId": "devA",
    "qr": "data:image/gif;base64,R0lGODlhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=",
    "isCo": false,
    "selling": null
  },

  // transient data (not stored in local storage)
  token: null, // session token (a stand-in for the deviceId in GET requests)
  socket: null, // webSocket connection
  timeout: null, // milliseconds before inactivity timeout (for return to Home Page)
  qr: null, // (blob) a scanned QR url
  msg: null, // an informational message to display on the Home Page (not yet used)
  erMsg: null, // error message to display on Home page
  online: null, // true if the device is connected to the Internet
  coPaying: false, // true if a company account is toggled to pay, refund, or sell CG credit (vs charge) - times out
  trail: [], // breadcrumbs to inform back button (see u.canGoBack and u.goBack)
  hdrLeft: 'logo', // what to show (if anything) at left side of the header
  pending: false, // true if a tx or comment is awaiting confirmation before upload
  modal: false, // modal dialog data (set false to hide the modal dialog)
  m1: null, // callback for modal button #1
  m2: null, // callback for modal button #2
  gotInfo: false, // true if we got transaction info from the server (set false to get it again)

  // for testing
  useWifi: true, // true to use wifi whenever possible (false if developer or test framework has disabled wifi)
  posts: 0, // operation counters for calls to u.postRequest, enQ, and deQ
  enQ: 0,
  deQ: 0,
  flushOk: false, // true if the tester is ready for queued txs/comments to be uploaded (keep separate from noUploads)
  now: null, // a stable timestamp (in seconds) for each Scenario
}

export default cache
