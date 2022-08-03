import SignIn from './SignIn.svelte'

// --------------------------------------------

describe('SignIn', () => {
  it('renders', () => {
    render(SignIn)
  })

  describe('when credentials are submitted', () => {
    it('requests an account from the Members API')
  })

  describe('when sign in is unsuccessful', () => {
    it('displays an error message')
  })

  describe('when sign in is successful', () => {
    it('stores the retrieved account and redirects to payment collection')
  })
})
