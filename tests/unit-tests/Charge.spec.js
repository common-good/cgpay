import Tx from '#modules/Tx.svelte'
import st from'#store.js'

// --------------------------------------------

describe('Tx', () => {
  it('renders', () => {
    st.setMe({ name: 'Business', accountId: '123' })

    render(Tx)
  })
})
