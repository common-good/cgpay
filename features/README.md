# CG Pay PWA - Features

End-to-end tests for the CG Pay progressive web application.

- [Testing](#testing)
- [Manual Features](#manual-features)

## Testing

| Command | Description |
| :-- | :-- |
| `npm test` | Run features in headless mode. |
| `npm run test:debug` | Run features with a browser and debugger. |

## Manual Features

The following features are challenging to test in an automated way and should be verified manually before each release.

### As a vendor, I can save the CGPay app to my iOS home screen so that it is easy to access.

1. Visit the app in the web browser of an iOS device.
2. Follow the instructions to save the app to the home screen.
3. Confirm that the application is added to the home screen:
  - With the correct icon.
  - With the correct name (CG Pay).
4. Open the application.
5. Confirm that the application's main screen displays.

### As a vendor, I can save the CGPay app to my Android home screen so that it is easy to access.

1. Visit the app in the web browser of an Android device.
2. Follow the instructions to save the app to the home screen.
3. Confirm that the application is added to the home screen:
  - With the correct icon.
  - With the correct name (CG Pay).
4. Open the application.
5. Confirm that the application's main screen displays.
