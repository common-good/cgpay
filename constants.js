const constants = {
  version: '4.0.1',
  storeKey: 'cgpay',
  qrUrlRegex: '^HTTP://[0-9A-Za-z]{1,4}\.RC[24]\.ME/[0-9A-Z]{2,5}[0-9A-Za-z]{0,25}$', // like HTTP://6VM.RC4.ME/KDJJ34kjdfKJ4
  testQrStart: 'HTTP://6VM.RC4.ME/', // is a test QR if it starts with this string
  port: 3000,
  onlineLimit: 10000,
  offlineLimit: 250,
  fetchTimeoutMs: 3200,
  networkTimeoutMs: 100,

  showDevStuff: false, // if true, show dev-only features
  showSelfServe: true, // if true, enable self-serve feature
  showScanToPay: false, // if true, enable scan-to-pay feature
  showShowToPay: true, // if true, enable show-to-pay feature

  // how long user has, on the current screen (in seconds), before we return automatically to Home
  txTimeout: 10, // Tx page
  doneTimeout: 10, // confirmation page
  testTimeout: 0.7, // how long user has when testing (compress time to make the tests run faster)

  domains: { // domains used in QR Codes
    real: 'RC2.ME',
    test: 'RC4.ME',
  },
  urls: { // list at least the ones that use real data
    staging:    'https://cgpay-staging.commongood.earth',
    production: 'https://cgpay.commongood.earth',
  },
  apis: {
//    test:  'http://localhost/cgmembers-frame/cgmembers/api/',
    test: 'https://demo.commongood.earth/api/', // should be test.cg.e when that db exists
    demo: 'https://demo.commongood.earth/api/',
    real: 'https://new.commongood.earth/api/',
  },
}

export default constants
