const constants = {
  version: '4.0.0',
  storeKey: 'cgpay',
  port: 3000,
  fetchTimeoutMs: 3200,
  networkTimeoutMs: 100,
  onlineLimit: 10000,
  offlineLimit: 250,
  isReleaseA: true,

  productionUrl: 'https://cgpay.commongood.earth',
  apis: {
    //  test:  'http://localhost/cgmembers-frame/cgmembers/api/',
    test: 'https://demo.commongood.earth/api/',
    demo: 'https://demo.commongood.earth/api/',
    real: 'https://new.commongood.earth/api/',
  },
}

export default constants
