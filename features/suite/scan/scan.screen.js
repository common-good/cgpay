export default (page) => {
  return {
    async visit() {
      await page.goto('/scan')
    },

    element(name) {
      const elements = {
        root: '#scan'
      }

      return page.locator(elements[name])
    },

    root() {
      return this.element('root')
    }
  }
}
