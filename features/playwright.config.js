export default {
  globalSetup: './tests/support.js',
  testMatch: '**/*.feature.js',
  timeout: 15000,

  use: {
    baseURL: 'http://localhost:7357'
  }
}
