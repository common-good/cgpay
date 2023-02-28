// --------------------------------------------

const iconSizes = [ 128, 144, 152, 192, 256, 512 ]

const icons = iconSizes.map((size) => ({
  src: `/icons/icon-${ size }x${ size }.png`,
  sizes: `${ size }x${ size }`,
  type: 'image/png',
  purpose: 'any maskable'
}))

// --------------------------------------------

export default {
  // Automatically update the application when a
  // new version is available, without prompting.
  //
  // https://vite-plugin-pwa.netlify.app/guide/auto-update.html
  registerType: 'autoUpdate',
  devOptions: {
    enabled: true
  },

  manifest: {
    background_color: '#5D9220',
    icons,
    name: 'CGPay',
    short_name: 'CGPay',
    display: 'standalone',
    theme_color: '#5D9220'
  },

  workbox: {
    // Ensure that all assets are cached for
    // offline access.
    //
    // https://vite-plugin-pwa.netlify.app/guide/static-assets.html#globpatterns
    globPatterns: [
      '**/*.{css,html,jpg,js,png,svg,webp}'
    ],
    clientsClaim: true,
    skipWaiting: true,
    cleanupOutdatedCaches: true,
  },
}
