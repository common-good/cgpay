import SelectAccount from './SelectAccount.svelte'

// --------------------------------------------

describe('SelectAccount', () => {
  it('renders', () => {
    render(SelectAccount, {accountOptions: [], size: null})
  })
})
