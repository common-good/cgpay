export default (page) => {
  return {
    async loseConnection() {
      await page._parent.setOffline(true)
    },

    async restoreConnection() {
      await page._parent.setOffline(false)
    },

    async visit() {
      await page.goto('/sign-in')
    },

    async with({ identifier, password }) {
      await this.element('identifierField').fill(identifier)
      await this.element('passwordField').fill(password)
      await this.element('signInButton').click()
    },

    root() {
      return this.element('root')
    },

    element(name) {
      const elements = {
        errorMessage: '#sign-in-error',
        identifierField: 'input[type="text"]',
        networkStatus: '#network-status',
        passwordField: 'input[type="password"]',
        root: '#sign-in',
        signInButton: 'button'
      }

      return page.locator(elements[name])
    }
  }
}
