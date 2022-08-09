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

### As a vendor, I can use the app offline so that it is reliable with a flaky connection.

1. Preview the UI using `npm run preview`.
2. While online, visit the UI in a private browsing window.
3. Ensure the UI displays properly.
4. Ensure the network status banner does not display.
5. Disable the internet connection.
6. Ensure the network status banner displays the "offline" message.
7. Refresh the page.
8. Ensure the network status banner still displays the "offline" message.
9. Ensure the UI displays properly while offline.
10. Enable the internet connection.
11. Ensure the network status banner displays the "back online" message.
12. Refresh the page.
13. Ensure the network status banner does not display.
