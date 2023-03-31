const constants = {
  version: '4.0.0',
  storeKey: 'cgpay',
  port: 3000,
  fetchTimeoutMs: 3200,
  networkTimeoutMs: 100,
  productionUrl: 'https://cgpay.commongood.earth',
  apis: {
    //  test:  'http://localhost/cgmembers-frame/cgmembers/api/',
    test: 'https://demo.commongood.earth/api/',
    demo: 'https://demo.commongood.earth/api/',
    real: 'https://new.commongood.earth/api/',
  },

  // just for testing
  headlessMode: true,
  slowMo: 0,
  testTimeoutMs: 12000,
  chromiumPath: '', // can be used to test different versions of chromium
  seeLog: true, // show what the automated browser logs to console
}

export default constants
