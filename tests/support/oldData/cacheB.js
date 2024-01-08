// initial values for conversion tests

const cache = {
  persist: 'version deviceId sawAdd cameraCount frontCamera useWifi selfServe payOk choices txs comments deviceIds corrupt accts myAccount',

  version: null, // latest app version that touched this data
  sawAdd: 1687568066, // time user pressed Continue on the Add-to-home-screen page
  cameraCount: 1, // number of cameras in the device - set this when scanning for the first time
  frontCamera: false, // true to use front camera instead of rear (default false iff mobile) - set this in Root.svelte (can't be defaulted from tests)
  useWifi: true, // true to use wifi whenever possible (false if developer or test framework has disabled wifi)
  selfServe: false, // true for self-serve mode
  payOk: 'always', // payments from this device are permitted: always, scan, or never - default for companies is scan (self-scan-in required, to pay)

  choices: [
    {
      "accountId": "K6VMDCA",
      "deviceId": "devA",
      "qr": "data:image/gif;base64,R0lGODlhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=", // white pixel
      "isCo": false,
      "name": "Abe One",
      "selling": null
    },
    {
      "accountId": "L6VMDCC0",
      "deviceId": "devC",
      "qr": "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", // black pixel
      "isCo": true,
      "name": "Citre",
      "selling": [
        "groceries",
        "gifts",
        "sundries"
      ]
    }
  ],
  txs: [], // transactions waiting to be uploaded
  comments: [], // comments waiting to be uploaded

  deviceIds: {}, // list of deviceIds keyed by accountId
  corrupt: null, // timestamp that cached data got corrupted
  accts: {}, // keyed list of accounts that user has transacted with (or tried to)
  myAccount: {
    "accountId": "K6VMDCA",
    "deviceId": "devA",
    "qr": "data:image/gif;base64,R0lGODlhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=",
    "isCo": false,
    "name": "Abe One",
    "selling": null
  },
  
  // transient data (not stored in local storage)
  token: null, // session token (a stand-in for the deviceId in GET requests)
  timeout: null, // milliseconds before inactivity timeout (for return to Home Page)
  qr: null, // (blob) a scanned QR url
  intent: null, // what to do on the next page: scanIn, pay, or charge
  msg: null, // an informational message to display on the Home Page (not yet used)
  erMsg: null, // error message to display on Home page
  online: true, // true if the device is connected to the Internet
  coPaying: false, // true if a company account is toggled to pay, refund, or sell CG credit (vs charge) - times out
  trail: [], // breadcrumbs to inform back button (see u.canGoBack and u.goBack)
  hdrLeft: 'logo', // what to show (if anything) at left side of the header
  pending: false, // true if a tx or comment is awaiting confirmation before upload
  modal: false, // modal dialog data (set false to hide the modal dialog)
  m1: null, // callback for modal button #1
  m2: null, // callback for modal button #2

  // for testing
  posts: 0, // operation counters for calls to u.postRequest, enQ, and deQ
  enQ: 0,
  deQ: 0,
  flushOk: false, // true if the tester is ready for queued txs/comments to be uploaded (keep separate from noUploads)
  now: null, // a stable timestamp (in seconds) for each Scenario
}

export default cache
