import Scan from './Scan.svelte'

// --------------------------------------------

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: {
    getCameras() {}
  }
}))

// --------------------------------------------

describe.skip('Scan', () => {
  it('renders', () => {
    render(Scan)
  })
})
