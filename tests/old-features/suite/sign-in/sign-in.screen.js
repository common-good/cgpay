export default (page) => {
  return {
    async visit() {
      await page.goto('/sign-in')
    },

    async with({ identifier, password }) {
      await this.element('identifierField').fill(identifier)
      await this.element('passwordField').fill(password)
      await this.element('signInButton').click()
    },

    element(name) {
      const elements = {
        errorMessage: '#sign-in-error',
        identifierField: 'input[type="text"]',
        passwordField: 'input[type="password"]',
        root: '#signin',
        signInButton: 'button'
      }

      return page.locator(elements[name])
    },

    root() {
      return this.element('root')
    }
  }
}
