// --------------------------------------------

const androidIconSizes = [
  ['hdpi', '72'], 
  ['mdpi', '48'],
  ['xhdpi', '96'], 
  ['xxhdpi', '144'], 
  ['xxxhdpi', '192']
]

const appleIconSizes = [ 16, 20, 29, 32, 40, 48, 50, 55, 57, 58, 60, 64, 66, 72, 76, 80, 87, 88, 92, 100, 102, 114, 120, 128, 144, 152, 167, 172, 180, 196, 216, 256, 512, 1024 ]

const androidIcons = androidIconSizes.map(([name, size]) => ({
  src: `/icons/android/mipmap-${name}/ic_launcher.png`,
  sizes: `${ size }x${ size }`,
  type: 'image/png',
  purpose: 'any maskable'
}))

const appleIcons = appleIconSizes.map(size => ({
  src: `/icons/Assets.xcassets/AppIcon.appiconset/${ size }.png`,
  sizes: `${ size }x${ size }`,
  type: 'image/png',
  purpose: 'any maskable'
}))

const icons = androidIcons.concat(appleIcons);

// --------------------------------------------

export default {
  // Automatically update the application when a
  // new version is available, without prompting.
  //
  // https://vite-plugin-pwa.netlify.app/guide/auto-update.html
  registerType: 'autoUpdate',

  manifest: {
    background_color: '#5D9220',
    icons,
    name: 'CGPay',
    short_name: 'CGPay',
    theme_color: '#5D9220'
  },

  workbox: {
    // Ensure that all assets are cached for
    // offline access.
    //
    // https://vite-plugin-pwa.netlify.app/guide/static-assets.html#globpatterns
    globPatterns: [
      '**/*.{css,html,jpg,js,png,svg,webp}'
    ]
  },
}
