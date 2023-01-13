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

function routeObj(gorp, endPt, page, record) {
  return {
    [gorp]: createMockableRoute({
      baseUrl: appContext('serverApi.dev') + '/' + endPt,
      page,
      record
    })
  }
}

// --------------------------------------------

export default function createRoutes({ page }) {
  const record = spy()

  return {
    record,

    accounts: routeObj('get', 'accounts', page, record),
    identity: routeObj('get', 'identity', page, record),
    idPhoto: routeObj('get', 'idPhoto', page, record),
    transactions: routeObj('post', 'transactions', page, record),
  }
}
