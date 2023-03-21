import { setDefaultTimeout, After, Before, BeforeAll, AfterAll, setWorldConstructor } from '@cucumber/cucumber'
import { putStore } from './support.js'
import puppeteer from 'puppeteer'
import fkill from 'fkill'
import { exec } from 'node:child_process'

setDefaultTimeout(60000)

BeforeAll(async () => {
  exec('npm run dev')
})

/*
Before(async () => { // You can clean up database models here (but not localStorage)

});

After(async () => {

})
*/

AfterAll(async () => {
//  if (this.browser) await this.browser.close() // If there is a browser window open, then close it
  await fkill(':3000')
//  this.api.shutdown(() => console.log('\nAPI is shut down'))
//  this.ui.shutdown(() => console.log('Web is shut down'))
})

const myWorld = function({ attach, parameters }) { // World cannot be async
  this.attach = attach
  this.parameters = parameters

//  w.host = ui.host
  this.driver = puppeteer
  this.context = {}
//  w.ui = ui
}

setWorldConstructor(myWorld)
