@all @offline
Feature: Offline
  As a vendor or individual
  I see a banner when my network goes offline
  So I am aware if the network is offline.

  As a vendor
  I can charge customers in offline mode
  So my business is not interrupted.

Background:
 * this "myAccount":
 | accountId | deviceId | name    | qr | isCo  | selling | lastTx |
 | K6VMDJK   | devC     | Citre   | ?  | false | null    | null   |

Rule: If we go offline when the user is adding to home screen, the user can still click continue

Scenario: We go offline right after a user runs the app
  Given this "myAccount": "null"
  And I use "Chrome" on an "Android" device
  When I run the app
  And we are offline
  When I click "continue-button"
  Then ? I am on page "sign-in"

Rule: We give an error message if the user tries to sign in offline

Scenario: A user tries to sign in offline
  Given this "myAccount": "null"
  And I use "Chrome" on an "Intel Desktop" device
  When I run the app
  Then ? I am on page "sign-in"
  Given we are offline
  When I input "a" as "identifier"
  And I input "k" as "password"
  And I click "btn-signin"
  And I wait 3 seconds
  Then ? I see this error: "Check your internet connection"

Rule: The user can link an account offline (see the link-account feature)

Rule: Comments are accepted offline (see the comment feature)

Rule: We process and cache transactions submitted offline

Scenario: The network goes offline and status is visible
  Given we are offline
  Then ? I see "network-offline"

Scenario: I charge another user while offline
  Given I am offline
  And I scan ".B"'s QR
  

Scenario: I charge another user while offline
  When I charge another user while offline
  Then ? The app caches the transaction to be completed when I reconnect

Rule: When we're back online we upload any stored transactions and/or comments

Scenario: We reconnect to the internet
  When I reconnect to the internet with cached transactions
  Then ? The app completes the cached transactions
