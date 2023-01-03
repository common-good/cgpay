import createContext from '@jrh/adapt'

// ---------------------------------------------

export default createContext({
  environment: process.env,

  configuration: {
    mode: '[mode]',

    devServer: {
      ports: {
        _default: 3000,
        testing: '[cg_pay_ui_port]'
      }
    },

    membersApi: {
//      location: 'http://localhost/cgmembers-frame/cgmembers/api'
      location: 'https://demo.commongood.earth/api'
//      location: 'https://new.commongood.earth/api'
    }
  }
})
