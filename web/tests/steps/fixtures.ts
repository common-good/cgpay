import { test as base, createBdd } from 'playwright-bdd'
import { TestDb } from '../support/test-db'

type Fixtures = { testDb: TestDb }

// `testDb` is an auto fixture: it runs before every scenario, so each one starts
// from the default test accounts (the old app's Before() hook did the same).
export const test = base.extend<Fixtures>({
  testDb: [
    async ({ request }, use) => {
      const db = new TestDb(request)
      await db.initialize()
      await use(db)
    },
    { auto: true }
  ]
})

export const { Given, When, Then } = createBdd(test)
