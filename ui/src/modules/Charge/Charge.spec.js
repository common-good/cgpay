import Charge from './Charge.svelte'
import store from '#app.store.js'

// --------------------------------------------

describe.skip('Charge', () => {
  it('renders', () => {
    store.auth.signIn({ account: {} })
    store.business.link({ name: 'Business' })

    render(Charge)
  })
})
