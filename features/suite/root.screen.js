export default (page) => {
  return {
    async visit() {
      await page.goto('/')
    },

    async loseConnection() {
      await page._parent.setOffline(true)
    },

    async restoreConnection() {
      await page._parent.setOffline(false)
    },

    root() {
      return this.element('root')
    },

    element(name) {
      const elements = {
        networkStatus: '#network-status',
        root: 'main'
      }

      return page.locator(elements[name])
    }
  }
}
