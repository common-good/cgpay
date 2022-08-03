import AndroidInstructions from './AndroidInstructions.svelte'

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

  describe('when the skip button is clicked', () => {
    it('runs the given skip function', async () => {
      const skip = mock()

      const user = userEvent.setup()
      const component = render(AndroidInstructions, { ...valid.props, skip })
      await user.click(component.getByText('Skip'))

      expect(skip).toHaveBeenCalledOnce()
    })
  })
})
