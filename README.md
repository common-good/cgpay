# CG Pay PWA

A progressive web application for collecting payments with Common Good. 

- [Setting Up](#setting-up)
- [Feature Testing](#feature-testing)
- [Developing](#development)
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
