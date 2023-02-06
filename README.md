# CGPay PWA

A progressive web application for collecting payments with Common Good. 

- [Setting Up](#setting-up)
- [Feature Testing](#feature-testing)
- [Developing](#development)
- [Development Workflow](#development-workflow)
- [Deploying](#deploying)

## Set Up

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

## Developing (Quickstart)

For more information, see the [Features documentation](/features) and [UI documentation](/ui).

| Directory | Command | Notes |
| :-- | :-- | :-- |
| `/ui` | `npm run dev` | then ctrl-Click http://localhost:3000/ to open in default browser |
| `/ui` | `npm run tests:watch` | |
| `/features` | `npm test` | |
| `/features` | `npm test <test name>` | |

## Development Workflow

1. Create a feature branch off of `develop` (i.e. `feature-sign-in`).
2. Go through an outside-in development workflow.

- Start with a (failing) feature test.
- Write (failing) unit tests for the components you wish you had to pass the feature.
- Write just enough code to make the unit tests pass until the feature test also passes.
- Refactor/clean up.

3. Submit a pull request from your feature branch to `develop`, and have it reviewed.
4. When the pull request is approved and merged into `develop`, test the application on the [test site](#deploying).
5. When a new release is ready for deployment, merge the `develop` branch into `master`.

## Deploying

Deployments used to be automatic via Vercel's GitHub integration. We are no longer using that, but have no replacement yet.

Deploy branches to the following URLs (Note: these are not settled yet):

| Git Branch | Environment | URL | Shortcut |
| :-- | :-- | :-- | :-- |
| `master` | `production` | https://cgpay.commongood.earth | cg4.us/app |
| `develop` | `develop` | https://cgpay2.commongood.earth | cg4.us/app2 |

### Deployment Checklist

Before deploying a new release, remember to:

1. Run all [UI unit tests](/ui).
2. Run all [feature tests](/features).
3. Verify all [manual features](/features).
