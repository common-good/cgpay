export default (page) => {
  return {
    async visit() {
      await page.goto('/')
    },

    element(name) {
      const elements = {
        root: '#pay'
      }

      return page.locator(elements[name])
    }
  }
}
