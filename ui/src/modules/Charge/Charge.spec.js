import Charge from './Charge.svelte'
import store from '#store.js'

// --------------------------------------------

describe('Charge', () => {
  it('renders', () => {
    store.setMyAccount({ name: 'Business', accountId: '123' })

    render(Charge)
  })
})
