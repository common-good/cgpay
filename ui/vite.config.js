import to from '@jrh/to'
import { VitePWA } from 'vite-plugin-pwa'
import { imagetools } from 'vite-imagetools'
import { svelte } from '@sveltejs/vite-plugin-svelte'

import context from './context/context.provider.js'
import pwaConfig from './vite.pwa.config.js'

// --------------------------------------------

export default {
  define: {
    __serverApi__: JSON.stringify(context('serverApi.dev'))
  },

  plugins: [
    imagetools(),
    svelte(),
    VitePWA(pwaConfig)
  ],

  resolve: {
    alias: {
      '#store.js': to('./src/store.js', import.meta.url),
      '#utils.js': to('./src/utils.js', import.meta.url),
      '#db.js': to('./src/db.js', import.meta.url),
      '#modules': to('./src/modules', import.meta.url),
    }
  },

  server: {
    port: context('devServer.port')
  },

  test: {
    environment: 'jsdom',
    globals: true,
    mockReset: true,
    setupFiles: './tests/support.js'
  }
}
