export default (page) => {
  return {
    async scanAgain() {
      await this.element('scanButton').click()
    },

    async visit() {
      await page.goto('/tx')
    },

    async with({ amount, description }) {
      await this.element('amountField').fill(amount)
      await this.element('descriptionField').fill(description)
      await this.element('chargeButton').click()
    },

    element(name) {
      const elements = {
        amountField: '#amount',
        businessName: 'h1',
        chargeButton: 'button[type="submit"]',
        descriptionField: '#description',
        profile: '#charge-profile',
        profilePhoto: '#charge-profile img',
        root: '#charge',
        scanButton: 'a',
        transactionDetails: '#charge-transaction-details'
      }

      return page.locator(elements[name])
    },

    root() {
      return this.element('root')
    }
  }
}
