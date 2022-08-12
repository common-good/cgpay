export default (page) => {
  return {
    async visit() {
      await page.goto('/link-account')
    },

    async loseConnection() {
      await page._parent.setOffline(true)
    },

    async restoreConnection() {
      await page._parent.setOffline(false)
    },

    async chooseBusiness(name) {
      await this.element('businessSelector').selectOption(name)
      await this.element('submitButton').click()
    },

    root() {
      return this.element('root')
    },

    element(name) {
      const elements = {
        businessOptions: '#select-business option',
        businessSelector: '#select-business',
        networkStatus: '#network-status',
        root: '#link-account',
        submitButton: 'button'
      }

      return page.locator(elements[name])
    }
  }
}
