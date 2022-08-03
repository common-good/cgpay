import HomeScreenInstructions from './HomeScreenInstructions.svelte'

// --------------------------------------------

import preferencesStore from '../Preferences/preferences.store.js'
import { navigateTo } from 'svelte-router-spa'

vi.mock('../Preferences/preferences.store.js', () => ({
  default: {
    skipHomeScreenPrompt: mock()
  }
}))

vi.mock('svelte-router-spa', () => ({
  navigateTo: mock()
}))

// --------------------------------------------

vi.stubGlobal('window', { navigator: { userAgent: '' } })

// --------------------------------------------

describe('HomeScreenInstructions', () => {
  it('renders', () => {
    render(HomeScreenInstructions)
  })

  describe('on an Apple device', () => {
    beforeEach(() => {
      vi.mocked(window).navigator.userAgent = 'iPhone'
    })

    it('displays instructions for Apple devices', () => {
      const component = render(HomeScreenInstructions)
      expect(component.getByText('Apple')).toBeInTheDocument()
    })

    describe('skip button (Integration)', () => {
      it('sets the user preference and redirects to the main page', async () => {
        const user = userEvent.setup()
        const component = render(HomeScreenInstructions)
        await user.click(component.getByText('Skip'))

        expect(vi.mocked(preferencesStore).skipHomeScreenPrompt)
          .toHaveBeenCalledOnce()

        expect(vi.mocked(navigateTo)).toHaveBeenCalledOnce()
          .and.toHaveBeenCalledWith('/')
      })
    })
  })

  describe('on an Android device', () => {
    beforeEach(() => {
      vi.mocked(window).navigator.userAgent = 'Android'
    })

    it('displays instructions for Android devices', () => {
      const component = render(HomeScreenInstructions)
      expect(component.getByText('Android')).toBeInTheDocument()
    })

    describe('skip button (Integration)', () => {
      it('sets the user preference and redirects to the main page', async () => {
        const user = userEvent.setup()
        const component = render(HomeScreenInstructions)
        await user.click(component.getByText('Skip'))

        expect(vi.mocked(preferencesStore).skipHomeScreenPrompt)
          .toHaveBeenCalledOnce()

        expect(vi.mocked(navigateTo)).toHaveBeenCalledOnce()
          .and.toHaveBeenCalledWith('/')
      })
    })
  })
})
