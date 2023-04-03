// initial values for store

const cache = {
  sawAdd: false,
  qr: null,
  msg: null, // not yet used
  erMsg: null,
  cameraCount: 0, // set this when scanning for the first time
  frontCamera: null, // set this in Root.svelte (can't be defaulted from tests)
  online: null,
  useWifi: true,
  selfServe: false,

  choices: null,
  txs: [],
  comments: [],

  corrupt: null,
  accts: {},
  myAccount: null,
  isReleaseA: true,

  fromTester: {}, // values to update at the request of the test framework (see hooks.js and t.putv())
}

export default cache
