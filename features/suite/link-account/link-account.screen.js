export default (page) => {
  return {
    async visit() {
      await page.goto('/link-account')
    },

    async chooseBusiness(name) {
      await this.element('businessSelector').selectOption({ label: name })
      await this.element('submitButton').click()
    },

    root() {
      return this.element('root')
    },

    element(name) {
      const elements = {
        businessOptions: '#select-business option',
        businessSelector: '#select-business',
        root: '#link-account',
        scanButton: '"Scan QR Code"',
        submitButton: 'button'
      }

      return page.locator(elements[name])
    }
  }
}
