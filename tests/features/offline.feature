@all @offline
Feature: Offline
  As a vendor or individual
  I see a banner when my network goes offline
  So I am aware if the network is offline.

  As a vendor
  I can charge customers in offline mode
  So my business is not interrupted.

Background:
  * we are offline
  * I am signed in as "Bea"

Rule: For most offline functionality, see the individual features

Scenario: The network goes offline and status is visible
#  Given I wait 2 seconds
  And I wait 2 seconds
  When I run the app
  Then ? I see "network-offline"


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
