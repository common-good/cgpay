export default (page) => {
  return {
    async visit() {
      await page.goto('/scan')
    },

    root() {
      return this.element('root')
    },

    element(name) {
      const elements = {
        root: '#scan'
      }

      return page.locator(elements[name])
    }
  }
}
