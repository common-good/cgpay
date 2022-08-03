# CG Pay PWA

A progressive web application for collecting payments with Common Good. 

- [Setting Up](#setting-up)
- [Feature Testing](#feature-testing)
- [Developing](#development)
- [Development Workflow](#development-workflow)
- [Deploying](#deploying)

## Setting Up

### Install System Dependencies

| Dependency | Version |
| :-- | :-- |
| `node` | `16.x` |

### Install Project Dependencies

| Directory | Command |
| :-- | :-- |
| `/` | `npm install` |

## Developing (Quickstart)

For more information, see the [Features documentation](/features) and [UI documentation](/ui).

| Directory | Command |
| :-- | :-- |
| `/features` | `npm test` |
| `/ui` | `npm run dev` |
| `/ui` | `npm run tests:watch` |

## Development Workflow

1. Create a feature branch off of `preview` (i.e. `feature-sign-in`).
2. Go through an outside-in development workflow.

- Start with a (failing) feature test.
- Write (failing) unit tests for the components you wish you had to pass the feature.
- Write just enough code to make the unit tests pass until the feature test also passes.
- Refactor/clean up.

3. Submit a pull request from your feature branch to `preview`, and have it reviewed.
4. When the pull request is approved and merged into `preview`, test the application on the [preview site](#deploying).
5. When a new release is ready for deployment, merge the `preview` branch into `master`.

## Deploying

Deployments are automatic via Vercel's GitHub integration.

Pushing a new commit to the following branches will trigger a deployment:

| Git Branch | Environment | URL |
| :-- | :-- | :-- |
| `master` | `production` | https://pay.cg4.us |
| `preview` | `preview` | https://pay-preview.cg4.us |

### Deployment Checklist

Before deploying a new release, remember to:

1. Run all [UI unit tests](/ui).
2. Run all [feature tests](/features).
3. Verify all [manual features](/features).
