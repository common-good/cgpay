export default (page) => {
  return {
    async visit() {
      await page.goto('/home-screen-instructions')
    },

    async skipHomeScreenPrompt() {
      await this.element('skip').click()
    },

    element(name) {
      const elements = {
        androidInstructions: '#android-instructions',
        appleInstructions: '#apple-instructions',
        root: '#home-screen-instructions',
        skip: 'button'
      }

      return page.locator(elements[name])
    }
  }
}
