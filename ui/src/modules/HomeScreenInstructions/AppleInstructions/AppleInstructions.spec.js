import AppleInstructions from './AppleInstructions.svelte'

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

  describe('when the skip button is clicked', () => {
    it('runs the given skip function', async () => {
      const skip = mock()

      const user = userEvent.setup()
      const component = render(AppleInstructions, { ...valid.props, skip })
      await user.click(component.getByText('Skip'))

      expect(skip).toHaveBeenCalledOnce()
    })
  })
})
