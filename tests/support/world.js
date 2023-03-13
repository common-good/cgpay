const { setDefaultTimeout, Before, After, setWorldConstructor } = require('@cucumber/cucumber')
const { chromium } = require('playwright')

setDefaultTimeout(60000)

function myWorld({ attach, parameters }) { // World cannot be async
  this.attach = attach
  this.parameters = parameters

  this.pw = async function () {
    const browser = await chromium.launch({ headless:true })
    const context = await browser.newContext()
    const page = await context.newPage()
    return { browser:browser, context:context, page:page }
  }
}

setWorldConstructor(myWorld)

/*
Before(async () => { // Before and After have no access to World
})

After(async () => {
})
*/
