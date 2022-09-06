import Root from './Root.svelte'

// --------------------------------------------
// Set up integration with the Scan component,
// since the Root component redirects to it and
// components are not mocked.

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: {
    getCameras() {}
  }
}))

// --------------------------------------------

describe.skip('Root', () => {
  it('renders', () => {
    render(Root)
  })
})
