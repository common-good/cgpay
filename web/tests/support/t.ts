import pages from './pages'
import data from './data'
import api from './api'

// Everything the steps call, in one place (like the t of the legacy app's tests): t.click(app, id), t.soSee(app, text), ...
export default { ...pages, ...data, ...api }
