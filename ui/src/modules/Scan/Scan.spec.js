import store from '#app.store.js'

import Scan from './Scan.svelte'

// --------------------------------------------

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: {
    getCameras() {}
  }
}))

// --------------------------------------------

describe('Scan', () => {
  it('renders', () => {
    store.accounts.link({})
    render(Scan)
  })
})
