Feature: Offline
  As a vendor
  I can charge customers when the network is down
  So my business is not interrupted, and what I charged is sent when the network is back.

  Ported from the legacy app's tests/features/offline.feature and the offline scenarios of its scan and charge features.
  The network is really cut (the browser goes offline); the bundled screens still load, as they do from the phone's storage, and the live site does not.

Background:
  Given signed in as "Bea"
  And acting as "Cit"
  And in the store app
  And camera shows "Dee"
  When click "nav-app"
  Then text "acct": "Account: Citre"

Rule: The app starts offline and offers Pay and Charge from its own home screen

Scenario: The app is started with no network
  When network off
  And reload
  Then text "acct": "Account: Citre"
  And see "btn-pay"
  And see "btn-receive"

Rule: A scan offline still shows a profile, and the member is told to trust it or check ID

Scenario: A company scans a customer it has not seen before
  When network off
  And scan "Dee" to "charge"
  Then text "messageText": "OFFLINE. Trust this member or ask for ID."
  And text "theirName": ""

Scenario: A company scans a repeat customer, whose name comes from the last time
  When scan "Dee" to "charge"
  Then see "charge-profile"

  When network off
  And scan "Dee" to "charge"
  Then see "messageText"

  When click "btn1"
  Then text "theirName": "Dee Four"

Rule: Offline, a customer not seen before can be charged up to a fixed limit

Scenario: A cashier charges more than the offline limit
  When network off
  And scan "Dee" to "charge"
  And click "btn1"
  And input:
  | input-amount | input-description |
  | 300          | food!             |
  And click "btn-submit"
  Then text "messageText": "This transaction is limited to $250.00."
  And count "txs" is 0

Rule: When the phone is out of space, a transaction that cannot be saved is not taken

Scenario: A cashier charges offline on a phone that is out of space
  When network off
  And storage full
  And scan "Dee" to "charge"
  And click "btn1"
  And input:
  | input-amount | input-description |
  | 12.34        | food!             |
  And click "btn-submit"
  Then text "messageText": "This phone is out of space, so the transaction could not be saved. Free some space on the phone and try again."
  And see not "tx-summary"

Rule: What was charged offline is sent when the connection is back

Scenario: A company charges offline, then the connection returns
  When network off
  And scan "Dee" to "charge"
  And click "btn1"
  And input:
  | input-amount | input-description |
  | 234.50       | food!             |
  And click "btn-submit"
  Then text "other-name": "Unidentified Member"
  And text "amount": "234.50"

  When click "btn-done"
  Then on page "home"
  And see "queued"
  And count "txs" is 0

  When network on
  Then these "txs" rows:
  | uid1 | uid2 | agt1 | agt2 | amt    | for2  |
  | Dee  | Cit  | Dee  | Bea  | 234.50 | food! |
  And see not "queued"

Rule: A broken answer from the server is not taken for a lost connection, and does not count as a yes

Scenario: The server answers a scan with an error page
  When server answers "identity" with an error page
  And scan "Dee" to "charge"
  Then on page ""
  And see "notice-error"
  And text "msg": "An unexpected error occurred. Please alert Common Good's support team."

Scenario: The server answers a queued transaction with an error page
  When network off
  And scan "Dee" to "charge"
  And click "btn1"
  And input:
  | input-amount | input-description |
  | 12.34        | food!             |
  And click "btn-submit"
  And click "btn-done"
  Then see "queued"

  When server answers "transactions" with an error page
  And network on
  Then app keeps 1 refused
  And see not "queued"
  And count "txs" is 0
