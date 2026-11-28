import { mount } from 'svelte'
import App from './App.svelte'
import { restoreEnv } from './lib/env'
import { log } from './lib/log'

addEventListener('error', e => log(`error: ${e.message} (${e.filename}:${e.lineno})`))
addEventListener('unhandledrejection', e => log(`unhandled: ${String(e.reason?.message ?? e.reason)}`))

restoreEnv().catch(() => {}).finally(() => mount(App, { target: document.getElementById('app')! }))
