import appContext from '../context/context.provider.js'
import queryString from 'query-string'

// --------------------------------------------

function createMockableRoute({ baseUrl, page }) {
  return {
    queryString: null,

    withQueryParams(params) {
      this.queryString = queryString.stringify(params)
      return this
    },

    async respondsWith(status, data) {
      const url = this.queryString
        ? baseUrl + '?' + this.queryString
        : baseUrl

      await page.route(url, route => {
        route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(data)
        })
      })
    }
  }
}

// --------------------------------------------

export default function createRoutes({ page }) {
  return {
    accounts: {
      get: createMockableRoute({
        baseUrl: appContext('membersApi.location') + '/accounts',
        page
      })
    },

    businesses: {
      get: createMockableRoute({ 
        baseUrl: appContext('membersApi.location') + '/businesses',
        page
      })
    }
  }
}
