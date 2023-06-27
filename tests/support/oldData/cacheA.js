// initial values for store

const cacheA = {
  sawAdd: 1687568066,
  qr: null,
  msg: null, // not yet used
  erMsg: null,
  cameraCount: 1, // set this when scanning for the first time
  frontCamera: false, // set this in Root.svelte (can't be defaulted from tests)
  online: true,
  useWifi: true,
  selfServe: false,

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
  txs: [],
  comments: [],

  corrupt: null,
  accts: {},
  myAccount: {
    "accountId": "K6VMDCA",
    "deviceId": "devA",
    "qr": "data:image/gif;base64,R0lGODlhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=",
    "isCo": false,
    "name": "Abe One",
    "selling": null
  },

  fromTester: {}, // values to update at the request of the test framework (see hooks.js and t.putv())
}

export default cacheA
