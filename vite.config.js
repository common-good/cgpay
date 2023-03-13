import to from '@adaptably/to'
import { VitePWA } from 'vite-plugin-pwa'
import { imagetools } from 'vite-imagetools'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import pwaConfig from './vite.pwa.config.js'
import { defineConfig } from 'vite'

const version = require('./package.json').version

function js(s) { return JSON.stringify(s) }

export default defineConfig({
  define: {
    _version_: js(version),
    _origins_: js({
      test: 'https://app1.commongood.earth', 
      real: 'https://app.commongood.earth'
    }),
    _apis_: js({
      test: 'https://demo.commongood.earth/api',
      real: 'https://new.commongood.earth/api'
    }),
  },

  plugins: [imagetools(), svelte(), VitePWA(pwaConfig)],

  resolve: {
    alias: {
      '#store.js': to('./src/store.js', { from: import.meta.url }),
      '#utils.js': to('./src/utils.js', { from: import.meta.url }),
      '#modules': to('./src/modules', { from: import.meta.url }),
// (this doesn't work for style imports)  '#styles': to('./src/styles', { from: import.meta.url }),
    },
  },

  server: {
    port: 3000,
  },

  test: {
    environment: "jsdom",
    globals: true,
    mockReset: true,
    setupFiles: './tests/unit-tests/unit-support.js',
    threads: false,
  },
})
