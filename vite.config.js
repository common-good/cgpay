import { VitePWA } from 'vite-plugin-pwa'
import { imagetools } from 'vite-imagetools'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import pwaConfig from './vite.pwa.config.js'
import { defineConfig } from 'vite'
import c from './constants.js'

const root = process.cwd()
function js(s) { return JSON.stringify(s) }

export default defineConfig({
  define: { // define these at compile time for efficiency
    _version_:        js(c.version),
    _storeKey_:       js(c.storeKey),
    _productionUrl_:  js(c.productionUrl),
    _apis_:           js(c.apis),
    _fetchTimeoutMs_: c.fetchTimeoutMs,
  },

  plugins: [imagetools(), svelte(), VitePWA(pwaConfig)],

  resolve: { // note: aliases are not available in tests or style imports
    alias: {
      '#store.js':     root + '/src/store.js',
      '#utils.js':     root + '/src/utils.js',
      '#constants.js': root + '/constants.js',
      '#modules':      root + '/src/modules',
    },
  },

  server: { port:c.port },

  test: {
    environment: "jsdom",
    globals: true,
    mockReset: true,
    setupFiles: './tests/unit-tests/unit-support.js',
    threads: false,
  },
})
