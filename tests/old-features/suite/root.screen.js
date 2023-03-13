export default (page) => {
  return {
    async loseConnection() {
      await page._parent.setOnline(false)
    },

    async restoreConnection() {
      await page._parent.setOnline(true)
    },

    async visit() {
      await page.goto('/')
    },

    element(name) {
      const elements = {
        networkStatus: '#network-status',
        root: 'main'
      }

      return page.locator(elements[name])
    },

    root() {
      return this.element('root')
    }
  }
}
