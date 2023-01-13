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

    serverApi: {
      local: 'http://localhost/cgmembers-frame/cgmembers/api',
      dev: 'https://demo.commongood.earth/api',
      production: 'https://new.commongood.earth/api',
    }
  }
})
