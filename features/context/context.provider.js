import createContext from '@jrh/adapt'

// ---------------------------------------------

export default createContext({
  environment: process.env,

  configuration: {
    serverApi: {
      local: 'http://localhost/cgmembers-frame/cgmembers/api'
      dev: 'https://demo.commongood.earth/api'
      production: 'https://new.commongood.earth/api'
    }
  }
})
