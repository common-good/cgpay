import Profile from './Profile.svelte'

// --------------------------------------------

describe('Profile', () => {
  it('renders', () => {
    render(Profile, { account: {} })
  })
})
