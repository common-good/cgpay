import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { imagetools } from 'vite-imagetools'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import legacy from '@vitejs/plugin-legacy'
import pwaConfig from './vite.pwa.config.js'
import c from './constants.js'

const root = process.cwd()
function js(s) { return JSON.stringify(s) }

export default defineConfig({
  define: { // global literals (wrap non-numeric values in js())
  },

  plugins: [
    imagetools(),
    svelte(),
    VitePWA(pwaConfig),
    legacy({ targets:['defaults'] }),
  ],

  resolve: { // note: aliases are not available in tests or style imports
    alias: {
      '#store.js':     root + '/src/store.js',
      '#cache.js':     root + '/src/cache.js',
      '#utils.js':     root + '/src/utils.js',
      '#db.js':        root + '/src/db.js',
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
