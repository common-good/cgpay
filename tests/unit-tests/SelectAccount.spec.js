import SelectAccount from '#modules/SelectAccount.svelte'

// --------------------------------------------

describe('SelectAccount', () => {
  it('renders', () => {
    render(SelectAccount, {accountOptions: [], size: null})
  })
})
