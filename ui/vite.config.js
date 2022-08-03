import { VitePWA } from 'vite-plugin-pwa'
import { svelte } from '@sveltejs/vite-plugin-svelte'

import context from './context/context.provider.js'
import pwaConfig from './vite.pwa.config.js'

// --------------------------------------------

export default {
  define: {
    __membersApi__: JSON.stringify(context('membersApi.location')),
    __mode__: JSON.stringify(context('mode'))
  },

  plugins: [
    svelte(),
    VitePWA(pwaConfig)
  ],

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
