import Tx from '#modules/Tx.svelte'
import store from '#store.js'

// --------------------------------------------

describe('Tx', () => {
  it('renders', () => {
    store.setMyAccount({ name: 'Business', accountId: '123' })

    render(Tx)
  })
})
