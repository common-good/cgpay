import { cleanup, render } from '@testing-library/svelte'

// --------------------------------------------
// Make sure all rendered components have been
// cleared from the virtual DOM.

beforeEach(cleanup)

// --------------------------------------------
// Add global helper functions.

Object.assign(global, {
  render
})
