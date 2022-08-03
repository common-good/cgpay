import fkill from 'fkill'
import to from '@jrh/to'
import { exec } from 'child_process'

// ---------------------------------------------
// Starts a UI development server to use for
// feature testing.

export default function setup() {
  const env = {
    ...process.env,
    cg_pay_ui_port: 7357
  }

  const paths = {
    ui: to('../../ui', import.meta.url)
  }

  const processes = {
    ui: exec('npm run dev:testing', { cwd: paths.ui, env })
  }

  return async function teardown() {
    await fkill(processes.ui.pid)
  }
}
