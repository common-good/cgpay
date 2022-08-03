// --------------------------------------------

const iconSizes = [ 128, 144, 152, 192, 256, 512 ]

const icons = iconSizes.map(size => ({
  src: `/icons/icon-${ size }x${ size }.png`,
  sizes: `${ size }x${ size }`,
  type: 'image/png',
  purpose: 'any maskable'
}))

// --------------------------------------------

export default {
  devOptions: {
    enabled: true
  },

  manifest: {
    background_color: '#b3f287',
    icons,
    name: 'CG Pay',
    short_name: 'CG Pay',
    theme_color: '#b3f287'
  }
}
