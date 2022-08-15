export default (page) => {
  return {
    async visit() {
      await page.goto('/charge')
    },

    root() {
      return this.element('root')
    },

    element(name) {
      const elements = {
        businessName: 'h1',
        customerLocation: '#customer-location',
        customerName: '#customer-name',
        customerPhoto: '#customer-photo',
        root: '#charge'
      }

      return page.locator(elements[name])
    }
  }
}
