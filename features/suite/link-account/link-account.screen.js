export default (page) => {
  return {
    async chooseAccount(name) {
      await this.element('accountSelector').selectOption({ label: name })
      await this.element('submitButton').click()
    },

    async visit() {
      await page.goto('/link-account')
    },

    async proceedToScan() {
      await this.element('scanButton').click()
    },

    element(name) {
      const elements = {
        accountOptions: '#select-account option',
        accountSelector: '#select-account select',
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
