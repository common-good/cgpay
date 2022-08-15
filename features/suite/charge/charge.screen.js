export default (page) => {
  return {
    async visit() {
      await page.goto('/charge')
    },

    root() {
      return this.element('root')
    },

    async with({ amount, description }) {
      await this.element('amountField').fill(amount)
      await this.element('descriptionField').fill(description)
      await this.element('chargeButton').click()
    },

    element(name) {
      const elements = {
        amountField: '#charge-amount',
        businessName: 'h1',
        chargeButton: 'button[type="submit"]',
        confirmation: '#confirmation',
        customerLocation: '#customer-location',
        customerName: '#customer-name',
        customerPhoto: '#customer-photo',
        descriptionField: '#charge-description',
        root: '#charge'
      }

      return page.locator(elements[name])
    }
  }
}
