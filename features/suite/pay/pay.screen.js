export default (page) => {
  return {
    async visit() {
      await page.goto('/')
    },

    root() {
      return this.element('root')
    },

    element(name) {
      const elements = {
        root: '#pay'
      }

      return page.locator(elements[name])
    }
  }
}
