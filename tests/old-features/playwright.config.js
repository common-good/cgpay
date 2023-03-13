export default {
  globalSetup: './tests/support.js',
  testMatch: '**/*.feature.js',
  timeout: 15000,

  // Testing offline functionality is flaky with multiple
  // workers.
  workers: 1,

  use: {
    baseURL: 'http://localhost:7357'
  }
}
