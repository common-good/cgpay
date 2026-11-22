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
