import AndroidInstructions from '#modules/AndroidInstructions.svelte'

// --------------------------------------------

describe('AndroidInstructions', () => {
  const valid = {
    props: {
      skip: () => {}
    }
  }

  it('renders', () => {
    render(AndroidInstructions, valid.props)
  })
})
