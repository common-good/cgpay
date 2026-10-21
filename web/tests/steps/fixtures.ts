import { test as base, createBdd, defineParameterType } from 'playwright-bdd'
import type { Page } from '@playwright/test'
import { TestDb } from '../support/test-db'
import { Vars, parseValue } from '../support/vars'

// What the steps work with: the page, the test database, the scenario's variables, and the time the scenario started (unix seconds).
export type App = { page: Page, testDb: TestDb, vars: Vars, now: number }

type Fixtures = { testDb: TestDb, app: App }

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
  ],
  app: async ({ page, testDb }, use) => {
    await use({ page, testDb, vars: new Vars(), now: Math.floor(Date.now() / 1000) })
  }
})

export const { Given, When, Then } = createBdd(test)

// A step that works as setup (Given) or as an action (When). Checks are Then steps, with their own definitions.
export const GWhen = ((pattern: any, fn: any) => { Given(pattern, fn); When(pattern, fn) }) as unknown as typeof Given

// {value} in a step pattern: a quoted string, a number, or a JSON array or object.
defineParameterType({ name: 'value', regexp: /"[^"]*"|'[^']*'|-?\d+(?:\.\d+)?|\[.*\]|\{.*\}/, transformer: parseValue })
