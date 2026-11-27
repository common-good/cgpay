Feature: Timeout
  As a vendor
  I can have the app finish a transaction on its own after the summary
  So I don't have to worry about the payment accidentally being undone, or never sent.

  Ported from the legacy app's tests/features/timeout.feature. It uses the bundled screens, whose summary timeout is shortened for tests (6 seconds, normally 10).

Background:
  Given signed in as "Bea"
  And acting as "Cit"
  And in the store app
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 1.23         | candy             |
  And click "btn-submit"
  Then see "tx-summary"

Rule: If nothing happens soon after the summary appears, the app goes back to the dashboard and the transaction is sent

Scenario: Nothing happens soon after the summary appears
  When wait 7 seconds
  Then on page ""
  And these "txs" rows:
  | uid1 | uid2 | agt1 | agt2 | amt  | for2  |
  | Dee  | Cit  | Dee  | Bea  | 1.23 | candy |

Rule: If something happens soon after the summary appears, the app does not time out

Scenario: The member clicks Undo and does not answer
  When click "btn-undo"
  And wait 8 seconds
  Then see "btn1"
  And count "txs" is 0

Scenario: The member clicks Undo, then changes their mind
  When click "btn-undo"
  And click "btn2"
  Then see "tx-summary"

  When wait 8 seconds
  Then on page ""
