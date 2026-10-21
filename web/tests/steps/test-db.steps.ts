import { expect } from '@playwright/test'
import { When, Then } from './fixtures'

let txs: unknown

When('I read the test transactions', async ({ testDb }) => { txs = await testDb.txs() })
Then('the test transactions are a list', async () => { expect(Array.isArray(txs)).toBe(true) })
