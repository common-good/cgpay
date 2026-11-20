import { mount } from 'svelte'
import App from './App.svelte'
import { restoreEnv } from './lib/env'

restoreEnv().catch(() => {}).finally(() => mount(App, { target: document.getElementById('app')! }))
