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
        identifierField: 'input[type="text"]',
        errorMessage: '#sign-in-error',
        passwordField: 'input[type="password"]',
        root: '#sign-in',
        signInButton: 'button'
      }

      return page.locator(elements[name])
    }
  }
}
