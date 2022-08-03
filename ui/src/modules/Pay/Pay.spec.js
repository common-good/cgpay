import Pay from './Pay.svelte'

// --------------------------------------------

describe('Pay', () => {
  it('renders', () => {
    render(Pay)
  })

  describe('without an account', () => {
    it.skip('redirects to sign in')
  })
})
