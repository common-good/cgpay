import store from '#app.store.js'

import LinkAccount from './LinkAccount.svelte'

// --------------------------------------------

async function mockFetch() {
  return {
    ok: true,

    async json() {
      return {
        businesses: []
      }
    }
  }
}

vi.stubGlobal('fetch', mockFetch)

// --------------------------------------------

describe('LinkAccount', () => {
  it('renders', () => {
    store.accounts.setPossibleAccounts([
      { id: 1 },
      { id: 2 },
      { id: 3 }
    ])

    render(LinkAccount)
  })
})
