# CG Pay PWA - UI

The user interface for the CG Pay progressive web application.

- [Developing](#developing)
- [Testing](#testing)

## Developing

| Command | Description |
| :-- | :-- |
| `npm run dev` | Run a UI server for local development |

## Testing

| Command | Description |
| :-- | :-- |
| `npm test` | Run unit tests once. |
| `npm run tests:watch` | Watch unit tests for changes. |

## Previewing

[Service workers only work in production builds](https://kit.svelte.dev/docs/service-workers), so to test PWA functionality locally the application must be compiled.

| Command | Description |
| :-- | :-- |
| `npm run preview` | Serve the UI compiled for production (in `preview` mode). |
