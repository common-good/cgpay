import Profile from '#modules/Profile.svelte'

// --------------------------------------------

describe('Profile', () => {
  it('renders', () => {
    render(Profile, {otherAccount: {}, photo: {}})
  })
})
