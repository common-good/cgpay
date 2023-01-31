import { cleanup, render } from '@testing-library/svelte'
import { afterEach } from 'vitest'

// --------------------------------------------
// Make sure all rendered components have been
// cleared from the virtual DOM.

beforeEach(cleanup)

// --------------------------------------------
// Add global helper functions.

Object.assign(global, {
  render
})

afterEach(cleanup)
