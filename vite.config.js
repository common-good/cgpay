import { VitePWA } from 'vite-plugin-pwa'
import { imagetools } from 'vite-imagetools'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import pwaConfig from './vite.pwa.config.js'
import { defineConfig } from 'vite'

const root = process.cwd()
function js(s) { return JSON.stringify(s) }

export default defineConfig({
  define: {
    _version_: js('4.0.0'),
    _storeKey_: js('cgpay'),
    _productionUrl_: js('https://cgpay.commongood.earth'),
    _apis_: js({
//      local:  'http://localhost/cgmembers-frame/cgmembers/api/',
      test: 'https://demo.commongood.earth/api/',
      demo: 'https://demo.commongood.earth/api/',
      real: 'https://new.commongood.earth/api/',
    }),
  },

  plugins: [imagetools(), svelte(), VitePWA(pwaConfig)],

  resolve: {
    alias: {
      '#store.js': root + '/src/store.js',
      '#utils.js': root + '/src/utils.js',
      '#modules': root + '/src/modules',
// (this doesn't work for style imports)  '#styles': root + '/src/styles',
    },
  },

  server: { port:3000 },

  test: {
    environment: "jsdom",
    globals: true,
    mockReset: true,
    setupFiles: './tests/unit-tests/unit-support.js',
    threads: false,
  },
})
