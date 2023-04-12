@all @offline
Feature: Offline
  As a vendor or individual
  I see a banner when my network goes offline
  So I am aware if the network is offline.

  As a vendor
  I can charge customers in offline mode
  So my business is not interrupted.

Background:
 * I am signed in as "Bea"

Rule: If we go offline when the user is adding to home screen, the user can still click continue

Scenario: We go offline right after a user runs the app
  Given I am not signed in
  And I use "Chrome" on an "Android" device
  When I run the app
  And we are offline
  When I click "continue-button"
  Then ? I am on page "sign-in"

Rule: We give an error message if the user tries to sign in offline
@a
Scenario: A user tries to sign in offline
  Given I am not signed in
  And I use "Chrome" on an "Intel Desktop" device
  When I run the app
  Then ? I am on page "sign-in"
  Given we are offline
  And I wait 2 seconds
  When I input "a" as "identifier"
  And I input "k" as "password"
  And I click "btn-signin"
  Then ? I see this error: "Check your internet connection"

Rule: The user can link an account offline (see the link-account feature)

Rule: Comments are accepted offline (see the comment feature)

Rule: We process and cache transactions submitted offline

Scenario: The network goes offline and status is visible
  Given we are offline
  And I wait 2 seconds
  When I run the app
  Then ? I see "network-offline"

Scenario: I scan an individual's QR offline
  Given we are offline
  When I scan "Abe"
  Then ? I am on page "charge"
  And ? I am on page "charge-profile"
  And ? I see "theirName" is not "Abe One"
  And ? I see "network-offline"
  And ? I see "Trust this member or ask for ID" in "messageText"

Scenario: I scan an individual's QR online, then again offline
  Given I run the app
  And these accounts:
  | Abe |
  And we are offline
  And I scan "Abe"
  Then ? I see "Trust this member or ask for ID" in "messageText"
  When I click "btn1"
  And I wait 1 seconds
  Then ? I see "theirName" is "Abe One"
  And ? I see "theirLocation" is "Aton, MA"

Scenario: I charge another user while offline
  When I charge another user while offline
  Then ? The app caches the transaction to be completed when I reconnect

Rule: When we're back online we upload any stored transactions and/or comments

Scenario: We reconnect to the internet with cached transactions
  Then ? The app completes the cached transactions
@a
Scenario: We reconnect to the internet with comments
  Given we are offline
  And these "comments":
  | actorId | created | deviceId | text           |
  | Bea     | now     | devB     | 👍 looks good! |
  When we are online
  And we wait for uploads
  Then ? this "comments": "[]"
  # And ? these server "comments":
  # | actorId | created | deviceId | text           |
  # | Bea     | now     | devB     | 👍 looks good! |
