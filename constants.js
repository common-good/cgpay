const constants = {
  version: '4.0.0',
  storeKey: 'cgpay',
  qrUrlRegex: '^HTTP://[0-9A-Za-z]{1,4}\.RC[24]\.ME/[0-9A-Za-z]{6,28}$', // like HTTP://6VM.RC4.ME/KDJJ34kjdfKJ4
  testQrStart: 'HTTP://6VM.RC4.ME/', // is a test QR if it starts with this string
  port: 3000,
  opTimeout: 30, // how long user has, on the current screeng (in seconds), before we return automatically to Home
  fetchTimeoutMs: 3200,
  networkTimeoutMs: 100,
  onlineLimit: 10000,
  offlineLimit: 250,

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
