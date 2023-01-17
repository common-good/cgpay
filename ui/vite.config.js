import to from '@adaptably/to';
import { VitePWA } from 'vite-plugin-pwa';
import { imagetools } from 'vite-imagetools';
import { svelte } from '@sveltejs/vite-plugin-svelte';

import adapt from '@adaptably/adapt';
import pwaConfig from './vite.pwa.config.js';

// --------------------------------------------

export default {
  define: {
    __membersApi__: JSON.stringify(adapt('membersApi.location')),
  },

  plugins: [imagetools(), svelte(), VitePWA(pwaConfig)],

  resolve: {
    alias: {
      '#store.js': to('./src/app.store.js', { from: import.meta.url }),
      '#utils.js': to('./src/utils.js', { from: import.meta.url }),
      '#db.js': to('./src/db.js', { from: import.meta.url }),
      '#modules': to('./src/modules', { from: import.meta.url }),
    },
  },

  server: {
    port: adapt('devServer.port'),
  },

  test: {
    environment: 'jsdom',
    globals: true,
    mockReset: true,
    setupFiles: './tests/support.js',
  },
};
