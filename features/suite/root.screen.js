export default (page) => {
  return {
    async loseConnection() {
      await page._parent.setOffline(true)
    },

    async restoreConnection() {
      await page._parent.setOffline(false)
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
