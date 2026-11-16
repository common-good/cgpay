Feature: Offline
  As a vendor
  I can charge customers when the network is down
  So my business is not interrupted, and what I charged is sent when the network is back.

  Ported from the legacy app's tests/features/offline.feature and the offline scenarios of its scan and charge features.
  The network is really cut (the browser goes offline), so these run only against the bundled screens, which keep working without it.

Rule: A scan offline still shows a profile, and the member is told to trust it or check ID

Scenario: A company scans a customer it has not seen before
  Given signed in as "Bea"
  And acting as "Cit"
  And in the store app
  And network off
  When scan "Dee" to "charge"
  Then text "messageText": "OFFLINE. Trust this member or ask for ID."
  And text "theirName": ""

Scenario: A company scans a repeat customer, whose name comes from the last time
  Given signed in as "Bea"
  And acting as "Cit"
  And in the store app
  When scan "Dee" to "charge"
  Then see "charge-profile"

  When on page ""
  And network off
  And scan "Dee" to "charge"
  Then see "messageText"

  When click "btn1"
  Then text "theirName": "Dee Four"

Rule: Offline, a customer not seen before can be charged up to a fixed limit

Scenario: A cashier charges more than the offline limit
  Given signed in as "Bea"
  And acting as "Cit"
  And in the store app
  And network off
  When scan "Dee" to "charge"
  And click "btn1"
  And input:
  | input-amount | input-description |
  | 300          | food!             |
  And click "btn-submit"
  Then text "messageText": "This transaction is limited to $250.00."
  And count "txs" is 0

Rule: What was charged offline is sent when the connection is back

Scenario: A company charges offline, then the connection returns
  Given signed in as "Bea"
  And acting as "Cit"
  And in the store app
  And network off
  When scan "Dee" to "charge"
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
