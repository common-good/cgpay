import { JSDOM } from 'jsdom'
import ShowQr from './ShowQr.svelte'

describe('ShowQr', () => {
  const dom = new JSDOM(`<!DOCTYPE html>npm <canvas></canvas>`)
  global.document = dom.window.document

  it('renders', () => {
    render(ShowQr)
  })
})
