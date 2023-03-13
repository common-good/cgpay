import Scan from '#modules/Scan.svelte'

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: {
    getCameras() {}
  }
}))

// --------------------------------------------

describe('Scan', () => {
  it('renders', () => {
    render(Scan)
  })
})
