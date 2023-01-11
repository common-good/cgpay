import createContext from '@jrh/adapt'

// ---------------------------------------------

export default createContext({
  environment: process.env,

  configuration: {
    membersApi: {
//      location: 'http://localhost/cgmembers-frame/cgmembers/api'
      location: 'https://demo.commongood.earth/api'
//      location: 'https://new.commongood.earth/api'
    }
  }
})
