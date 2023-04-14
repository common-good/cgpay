# CGPay PWA

A progressive web application for collecting payments with Common Good. 

- [Setting Up](#setting-up)
- [Developing](#developing)
- [Development Workflow](#development-workflow)
- [Unit Testing](#unit-testing)
- [Deploying](#deploying)
- [Releasing](#releasing)

## Setting Up

Windows developers do [this](https://docs.google.com/document/d/1d1pGjS5Z9sP_BgYYOFaVamekzxdeOWgg9lOAemVVQKU/edit) instead of the setup commands in the table below.

| Command | Purpose |
| :-- | :-- |
| `sudo apt update && sudo apt -y upgrade && sudo apt -y autoremove` | update all packages |
| `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh `<code>&#124;</code>` bash` | install nvm |
| `nvm install --lts` | install production version of node |
| `nvm install node` | install latest development version of node |
| `cd <development directory>` | |
| `mkdir cgpay` | create a directory for the repository |
| `cd cgpay` | |
| `git clone https://github.com/common-good/cg-pay-pwa.git .` | |
| `git checkout develop` | choose the development branch |
| `nvm install` | install and use the required node version for this project (16.x), as stored in .nvmrc |
| `npm install` | install the project's dependencies |
| `cd features` | |
| `npx playwright install` | install test framework and headless browsers |
| `npx playwright install-deps` | install test framework dependencies |

## Developing

For more information:
* [Features documentation](/features).
* [Puppeteer API](/https://pptr.dev/api)
* [Chai API](https://www.chaijs.com/api/)

| Command | Notes |
| :-- | :-- |
| `npm run dev` | then ctrl-Click http://localhost:3000/ to open in default browser |
| `npm run tests:watch` | |
| `npm test @all` | run all Cucumber/Gherkin end-to-end tests (you currently have to do "npm run dev" first, in a separate window) |
| `npm test @<tag>` | run a subset of tests -- tests are tagged at the top and/or before any Scenario |

**Note:** Use a private browsing window in order to avoid unpredictable caching behavior from the service worker.

## Development Workflow

1. Create a feature branch off of `develop` (i.e. `feature/sign-in`).
2. Go through an outside-in development workflow.

- Start with a (failing) feature test.
- Write (failing) unit tests for the components you wish you had to pass the feature.
- Write just enough code to make the unit tests pass until the feature test also passes.
- Refactor/clean up.

3. Submit a pull request from your feature branch to `develop`, and have it reviewed.
4. When the pull request is approved and merged into `develop`, test the application on the [test site](#deploying).
5. When a new release is ready for deployment, merge the `develop` branch into `main`.

## Unit Testing

| Command | Description |
| :-- | :-- |
| `npm utest` | Run unit tests once. |
| `npm run watch` | Watch unit tests for changes. |

### Testing Libraries

We use the following libraries for unit tests:

- [`vitest`](https://vitest.dev/api/)
- [`@testing-library/svelte`](https://testing-library.com/docs/svelte-testing-library/api)
- [`@testing-library/jest-dom`](https://github.com/testing-library/jest-dom#table-of-contents)

### Previewing

NPM RUN DEV first compiles the app into dev-dist before previewing the app in development mode.
The service worker provides offline functionality even in a development environment.
To view a production version locally, do NPM RUN BUILD, then copy the dist/ files to your web root.

## Deploying

For now, we deploy manually via SCP(SFTP) to Common Good's various servers.

Deploy branches to the following URLs:

| Git Branch | Environment |  URL | Shortcut | Server URL | API/data |
| :-- | :-- | :-- | :-- |:-- |:-- |
| `main` | `production` | https://cgpay.commongood.earth | cg4.us/pay | new.commongood.earth |  prod |
| `staging` | `staging` | https://cgpay-staging.commongood.earth | cg4.us/pay1 | new1.commongood.earth | prod |
| `develop` | `dev` | https://cgpay-dev.commongood.earth | cg4.us/pay2 | new1.commongood.earth | dev |
| `(other)` | `local` | https://localhost:3000 | (none) | localhost | dev or local |
| `demo` | `staging` | https://cgpay-demo.commongood.earth | cg4.us/demo | new1.commongood.earth | prod |

### Deployment Checklist

Before deploying a new release, remember to:

1. Run all [UI unit tests](/ui).
2. Run all [feature tests](/features).
3. Verify all [manual features](/features).

## Releasing

We use semantic versioning and [github tags](https://github.com/common-good/cg-pay-pwa/releases/new) on the `main` branch to track releases.  
The first release of CGPay, "Release A", is v4.0.0.
