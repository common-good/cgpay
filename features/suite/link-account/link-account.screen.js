export default (page) => {
  return {
    async visit() {
      await page.goto('/link-account')
    },

    async chooseBusiness(name) {
      await this.element('businessSelector').selectOption(name)
      await this.element('submitButton').click()
    },

    element(name) {
      const elements = {
        businessOptions: '#select-business option',
        businessSelector: '#select-business',
        root: '#link-account',
        submitButton: 'button'
      }

      return page.locator(elements[name])
    }
  }
}
