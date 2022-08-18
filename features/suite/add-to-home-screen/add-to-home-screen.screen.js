export default (page) => {
  return {
    async skipHomeScreenPrompt() {
      await this.element('skip').click()
    },

    async visit() {
      await page.goto('/add-to-home-screen')
    },

    element(name) {
      const elements = {
        androidInstructions: '#android-instructions',
        appleInstructions: '#apple-instructions',
        root: '#add-to-home-screen',
        skip: 'button'
      }

      return page.locator(elements[name])
    },

    root() {
      return this.element('root')
    }
  }
}
