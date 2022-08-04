import createContext from '@jrh/adapt'

// ---------------------------------------------

export default createContext({
  environment: process.env,

  configuration: {
    membersApi: {
      location: 'https://members.cg4.us'
    }
  }
})
