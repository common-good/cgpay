Feature: Store app transactions by token
  As a member with the store app on my phone
  I pay and charge with the app's own sign-in
  So the app talks to one server in one way, and a lost phone's sign-in can be ended.

  The bundled screens ask the live site (/api/app/identity, photo, tx) with the app's token; node asks PHP, which keeps the transaction engine.

Rule: A member signed in on the app's own screen pays through the live site

Scenario: A member signed in on the app pays another member
  Given store app has no account
  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  Then on page ""

  When scan "Dee" to "pay"
  And input:
  | input-amount | input-description |
  | 12.34        | food!             |
  And click "btn-submit"
  And click "btn-done"
  Then on page ""
  And these "txs" rows:
  | uid1 | uid2 | amt   | for2  |
  | Bea  | Dee  | 12.34 | food! |

Rule: A payment made while the sign-in stopped working waits for the next sign-in, and is not lost

Scenario: A member signed out elsewhere signs in again, and the waiting payment goes out
  Given store app has no account
  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  Then on page ""

  When network off
  And scan "Dee" to "pay"
  And click "btn1"
  And input:
  | input-amount | input-description |
  | 12.34        | food!             |
  And click "btn-submit"
  And click "btn-done"
  Then count "txs" is 0

  When all devices signed out for "Bea"
  And network on
  And store app opens
  Then on page "signin"
  And count "txs" is 0

  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  Then on page ""
  And these "txs" rows:
  | uid1 | uid2 | amt   | for2  |
  | Bea  | Dee  | 12.34 | food! |

Rule: A transaction the server refuses is told once, then forgotten on the phone (the server keeps it and emails the account)

Scenario: A payment the server refuses is told before the summary closes
  Given store app has no account
  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  Then on page ""

  When scan "Dee" to "pay"
  And input:
  | input-amount | input-description |
  | 12.34        | food!             |
  And click "btn-submit"
  Then see "tx-summary"

  Given these "users" rows:
  | uid | flags |
  | Dee | 0     |
  When click "btn-done"
  Then see "messageText"
  And app keeps 1 refused

  When click "btn1"
  Then on page ""
  And count "txs" is 0

Scenario: A company's offline charge to an account closed since is told on the home screen
  Given signed in as "Bea"
  And acting as "Cit"
  And in the store app
  And camera shows "Dee"
  When click "nav-app"
  And network off
  And scan "Dee" to "charge"
  And click "btn1"
  And input:
  | input-amount | input-description |
  | 12.34        | food!             |
  And click "btn-submit"
  And click "btn-done"
  Then see "queued"

  Given these "users" rows:
  | uid | flags |
  | Dee | 0     |
  When network on
  Then see "refusals"
  And see not "queued"
  And count "txs" is 0

  When click "btn-refusals-ok"
  Then see not "refusals"
  And app keeps 0 refused
