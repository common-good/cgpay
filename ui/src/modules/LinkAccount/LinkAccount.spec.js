import appStore from '#store.js'
import { writable } from 'svelte/store'

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

vi.mock('#app.store.js')
vi.stubGlobal('fetch', mockFetch)

// --------------------------------------------

describe('LinkAccount', () => {
  it('renders', () => {
    const { subscribe } = writable({
      auth: {
        account: {
          identifier: ''
        }
      },

      network: {}
    })

    vi.mocked(appStore.subscribe).mockImplementation(subscribe)
    render(LinkAccount)
  })
})
