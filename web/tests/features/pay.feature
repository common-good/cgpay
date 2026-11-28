Feature: Pay
  As a company or individual
  I can pay another member a specified amount
  So that funds are deducted from my account and added to theirs.

  Ported from the legacy app's tests/features/pay.feature. It runs through the dashboard handoff today, and against the ported screens later.
  A description ending in "!" tells the server not to warn about a duplicate transaction.

Rule: A payment records the amount and description, and shows a summary

Scenario: A company pays an individual
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "pay"
  And input:
  | input-amount | input-description |
  | 1234.50      | food!             |
  And click "btn-submit"
  Then see "tx-summary"
  And text "action": "Paid"
  And text "other-name": "Dee Four"
  And see not "agent"
  And text "description": "food!"
  And text "amount": "1,234.50"
  And see "thank-you"
  And see "btn-undo"

  When click "btn-done"
  Then on page ""
  And these "txs" rows:
  | uid1 | uid2 | agt1 | agt2 | amt     | for1  |
  | Cit  | Dee  | Bea  | Dee  | 1234.50 | food! |

Scenario: A company pays a company
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Flo/Gis" to "pay"
  And input:
  | input-amount | input-description |
  | 1234.50      | food!             |
  And click "btn-submit"
  Then text "other-name": "Gisette"
  And text "agent": "Flo Six"

  When click "btn-done"
  Then these "txs" rows:
  | uid1 | uid2 | agt1 | agt2 | amt     | for1  |
  | Cit  | Gis  | Bea  | Flo  | 1234.50 | food! |

Rule: A payer can undo a payment from its summary

Scenario: A company pays an individual, then thinks twice about undoing it, then undoes it
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "pay"
  And input:
  | input-amount | input-description |
  | 1234.50      | food!             |
  And click "btn-submit"
  And click "btn-undo"
  Then text "messageText": "Reverse the transaction?"
  And text "btn1": "Yes"
  And text "btn2": "No"

  When click "btn2"
  Then see "tx-summary"
  And see "btn-undo"

  When click "btn-undo"
  And click "btn1"
  Then on page ""
  And text "msg": "The transaction has been reversed."
  And count "txs" is 0

Rule: A transaction cannot exceed the other account's limit or the app's limit

Scenario: The other account has no balance and no credit
  Given these "users" rows:
  | uid | balance | floor |
  | Dee | -23     | 0     |
  And signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "pay"
  Then on page ""
  And see "notice-error"
  And text "msg": "This account has no remaining funds, so a transaction is not possible at this time."

Scenario: The other account has a balance and a credit line, but no connected bank account, so the credit line does not count
  Given these "users" rows:
  | uid | balance | floor |
  | Dee | 23      | -4    |
  And signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "pay"
  And input:
  | input-amount | input-description |
  | 30           | food!             |
  And click "btn-submit"
  Then text "messageText": "This transaction is limited to $23.00."
  And on page "tx"
  And count "txs" is 0

Scenario: The other account has a balance and a credit line with a connected bank account, but not enough
  Given these "users" rows:
  | uid | balance | floor | bankAccount              |
  | Dee | 23      | -4    | USkk21187028101234567890 |
  And signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "pay"
  And input:
  | input-amount | input-description |
  | 30           | food!             |
  And click "btn-submit"
  Then text "messageText": "This transaction is limited to $27.00."
  And on page "tx"
  And count "txs" is 0

Scenario: A payer tries to pay more than the app allows
  Given these "users" rows:
  | uid | balance | floor |
  | Dee | 9999    | -9999 |
  And signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "pay"
  And input:
  | input-amount | input-description |
  | 20000        | food!             |
  And click "btn-submit"
  Then text "messageText": "CGPay transactions are limited to $10,000.00"
  And on page "tx"
  And count "txs" is 0

Rule: The pay screen works from the keyboard

@bundled
Scenario: A payer types the amount on the keyboard, submits with Enter and closes the message with Enter
  Given these "users" rows:
  | uid | balance | floor |
  | Dee | 9999    | -9999 |
  And signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "pay"
  And input "input-description": "food!"
  And pad "1"
  And type "000001"
  And press "Enter"
  Then text "messageText": "CGPay transactions are limited to $10,000.00"
  And focus on "btn1"

  When press "Enter"
  Then see not "messageText"
  And on page "tx"
  And count "txs" is 0

Rule: An exchange for cash is marked as one, not as a purchase

Scenario: A company pays an individual for cash
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "pay"
  And click "cash"
  Then text "input-description": "cash"

  When input "input-amount": "20"
  And click "btn-submit"
  And click "btn-done"
  Then these "txs" rows:
  | uid1 | uid2 | agt1 | agt2 | amt   | goods |
  | Cit  | Dee  | Bea  | Dee  | 20.00 | 1     |
