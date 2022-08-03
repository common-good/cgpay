import '@testing-library/jest-dom'
import { cleanup, createEvent, fireEvent, render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'

// --------------------------------------------
// Make sure all rendered components have been
// cleared from the virtual DOM.

beforeEach(cleanup)

// --------------------------------------------
// Add global helper functions.

Object.assign(global, {
  createEvent,
  fireEvent,
  userEvent,
  mock: vi.fn,
  render
})
