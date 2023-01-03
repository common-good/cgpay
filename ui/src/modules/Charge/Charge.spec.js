import Charge from './Charge.svelte'
import store from '#app.store.js'

// --------------------------------------------

describe('Charge', () => {
  it('renders', () => {
//    store.auth.signIn({ account: {} })
    store.myAccount.set({ name: 'Business' })

    render(Charge)
  })
})
