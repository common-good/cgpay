import appContext from '../context/context.provider.js'
import queryString from 'query-string'
import { spy } from 'tinyspy'

// --------------------------------------------

function createMockableRoute({ baseUrl, page, record }) {
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

      await page.route(url, (route, request) => {
        // Record calls in order to test features like
        // offline request queuing.
        record({
          url,
          method: request.method(),
          body: JSON.parse(request.postData())
        })

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
  const record = spy()

  return {
    record,

    accounts: {
      get: createMockableRoute({
        baseUrl: appContext('membersApi.location') + '/accounts',
        page,
        record
      })
    },

    businesses: {
      get: createMockableRoute({ 
        baseUrl: appContext('membersApi.location') + '/businesses',
        page,
        record
      })
    },

    charges: {
      post: createMockableRoute({
        baseUrl: appContext('membersApi.location') + '/charges',
        page,
        record
      })
    }
  }
}
