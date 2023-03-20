export default (page) => {
  return {
    async chooseBusiness(name) {
      await this.element('businessSelector').selectOption({ label: name })
      await this.element('submitButton').click()
    },

    async visit() {
      await page.goto('/link-account')
    },

    element(name) {
      const elements = {
        businessOptions: '#select-account option',
        businessSelector: '#select-account select',
        root: '#link-account',
        scanButton: '"Scan QR Code"',
        submitButton: 'button'
      }

      return page.locator(elements[name])
    },

    root() {
      return this.element('root')
    }
  }
}
