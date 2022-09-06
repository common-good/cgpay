import createContext from '@jrh/adapt'

// ---------------------------------------------

export default createContext({
  environment: process.env,

  configuration: {
    membersApi: {
      location: 'https://new-testing.commongood.earth/api'
    }
  }
})
