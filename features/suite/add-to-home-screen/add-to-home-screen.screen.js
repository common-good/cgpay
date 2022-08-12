export default (page) => {
  return {
    async visit() {
      await page.goto('/add-to-home-screen')
    },

    async skipHomeScreenPrompt() {
      await this.element('skip').click()
    },

    root() {
      return this.element('root')
    },

    element(name) {
      const elements = {
        androidInstructions: '#android-instructions',
        appleInstructions: '#apple-instructions',
        root: '#add-to-home-screen',
        skip: 'button'
      }

      return page.locator(elements[name])
    }
  }
}
