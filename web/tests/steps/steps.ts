import type { DataTable } from 'playwright-bdd'
import { GWhen, Then } from './fixtures'
import { actAs, camera, click, input, onPage, select, signedIn, soError, soOnPage, soOnPhpPage, soPayAndChargeGoTo, soSee, soSeeNot, soSignedIn } from '../support/pages'
import { setThese, soThese } from '../support/data'
import { setVar, setVarTable } from '../support/vars'

GWhen('act as {string}', async ({ app }, who: string) => actAs(app, who))
GWhen('camera {string}', async ({ app }, state: string) => camera(app, state))
GWhen('click {string}', async ({ app }, id: string) => click(app, id))
GWhen('input {string}: {string}', async ({ app }, id: string, value: string) => input(app, id, value))
GWhen('on page {string}', async ({ app }, name: string) => onPage(app, name))
GWhen('select {string}: {string}', async ({ app }, id: string, label: string) => select(app, id, label))
GWhen('signed in as {string}', async ({ app }, who: string) => signedIn(app, who))
GWhen('these {string} rows:', async ({ app }, name: string, table: DataTable) => setThese(app, name, table))
GWhen('var {string} is {value}', async ({ app }, name: string, value: unknown) => setVar(app, name, value))
GWhen('var {string} row:', async ({ app }, name: string, table: DataTable) => setVarTable(app, name, table, 'row'))
GWhen('var {string} row pivoted:', async ({ app }, name: string, table: DataTable) => setVarTable(app, name, table, 'row pivoted'))
GWhen('var {string} rows:', async ({ app }, name: string, table: DataTable) => setVarTable(app, name, table, 'rows'))
GWhen('var {string} rows pivoted:', async ({ app }, name: string, table: DataTable) => setVarTable(app, name, table, 'rows pivoted'))
GWhen('var {string} values:', async ({ app }, name: string, table: DataTable) => setVarTable(app, name, table, 'values'))
GWhen('var {string} values pivoted:', async ({ app }, name: string, table: DataTable) => setVarTable(app, name, table, 'values pivoted'))

Then('error {string}', async ({ app }, message: string) => soError(app, message))
Then('on page {string}', async ({ app }, name: string) => soOnPage(app, name))
Then('on PHP page {string}', async ({ app }, path: string) => soOnPhpPage(app, path))
Then('pay and charge go to {string}', async ({ app }, where: string) => soPayAndChargeGoTo(app, where))
Then('see {string}', async ({ app }, what: string) => soSee(app, what))
Then('see not {string}', async ({ app }, what: string) => soSeeNot(app, what))
Then('signed in as {string}', async ({ app }, who: string) => soSignedIn(app, who))
Then('these {string} rows:', async ({ app }, name: string, table: DataTable) => soThese(app, name, table))
