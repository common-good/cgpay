import AppleInstructions from '#modules/AppleInstructions.svelte'

// --------------------------------------------

describe('AppleInstructions', () => {
  const valid = {
    props: {
      skip: () => {}
    }
  }

  it('renders', () => {
    render(AppleInstructions, valid.props)
  })
})
