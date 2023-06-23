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
  When I run the app
  Then ? I see "network-offline"

Rule: When we're back online we upload any stored transactions and/or comments

Scenario: We reconnect to the internet with cached transactions
  Given these "txs":
  | deviceId | amount   | actorId | otherId | description | created | proof | offline | version |
  | devC     | 1234.50  | Abe/Cit | Bea     | food!       | now     | hash  | true    | version |
  | devC     | -1234.50 | Abe/Cit | Bea     | food!       | now     | hash  | true    | version |
  When we are online
  And we wait for uploads
  Then ? we post this to "transactions":
  # tests just the most recent post
  | deviceId | amount   | actorId | otherId | description | created | proof | offline | version |
  | devC     | -1234.50 | Abe/Cit | Bea     | food!       | now     | hash  | true    | version |
  And ? count "txs" is 0
  And ? these server "txs":
  | amt      | actorId | uid1 | uid2  | agt1 | agt2 | for2  | created | 
  | 1234.50  | Cit     | Bea  | Cit   | Bea  | Abe  | food! | now     |
  | -1234.50 | Cit     | Bea  | Cit   | Bea  | Abe  | food! | ?       |
@a 
Scenario: We reconnect to the internet with comments
  Given we are offline
  And these "comments":
  | actorId | created | deviceId | text           |
  | Bea     | now     | devB     | 👍 looks good! |
  When we are online
  And we wait for uploads
  Then ? we post this to "comments":
  | actorId | created | deviceId | text           |
  | Bea     | now     | devB     | 👍 looks good! |
  And ? this "comments": "[]"
