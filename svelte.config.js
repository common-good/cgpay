import preprocess from 'svelte-preprocess'

// --------------------------------------------

export default {
  preprocess: [
    preprocess({
      stylus: { prependData: '@import "./src/styles/app.support.styl"' }
    })
  ]
}
