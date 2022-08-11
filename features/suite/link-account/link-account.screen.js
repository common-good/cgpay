export default (page) => {
  return {
    async visit() {
      await page.goto('/link-account')
    },

    element(name) {
      const elements = {
        root: '#link-account'
      }

      return page.locator(elements[name])
    }
  }
}
