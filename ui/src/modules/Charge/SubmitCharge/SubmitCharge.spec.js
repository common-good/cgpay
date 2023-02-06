import SubmitCharge from './SubmitCharge.svelte'

// --------------------------------------------

describe('SubmitCharge', () => {
  it('renders', () => {
    render(SubmitCharge, { otherAccount: {}, photo: '', tx: {}, limit: 0 })
  })
})
