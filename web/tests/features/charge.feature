Feature: Charge
  As a company or individual
  I can charge another member a specified amount
  So that funds are deducted from their account and added to mine.

  Ported from the legacy app's tests/features/charge.feature. It runs through the dashboard handoff today, and against the ported screens later.
  A description ending in "!" tells the server not to warn about a duplicate transaction.

Rule: A charge records the amount and description, and shows a summary

Scenario: A company charges an individual
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 1234.50      | food!             |
  And click "btn-submit"
  Then see "tx-summary"
  And text "action": "Charged"
  And text "other-name": "Dee Four"
  And see not "agent"
  And text "description": "food!"
  And text "amount": "1,234.50"
  And see "thank-you"
  And see "btn-undo"

  When click "btn-done"
  Then on page ""
  And these "txs" rows:
  | uid1 | uid2 | agt1 | agt2 | amt     | for2  |
  | Dee  | Cit  | Dee  | Bea  | 1234.50 | food! |

Scenario: A company charges a company
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Flo/Gis" to "charge"
  And input:
  | input-amount | input-description |
  | 1234.50      | food!             |
  And click "btn-submit"
  Then text "action": "Charged"
  And text "other-name": "Gisette"
  And text "agent": "Flo Six"

  When click "btn-done"
  Then these "txs" rows:
  | uid1 | uid2 | agt1 | agt2 | amt     | for2  |
  | Gis  | Cit  | Flo  | Bea  | 1234.50 | food! |

Scenario: An individual charges an individual, which sends the other an invoice
  Given signed in as "Bea"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 12.34        | food!             |
  And click "btn-submit"
  Then text "action": "Charged"

  When click "btn-done"
  Then on page ""
  And these "tx_requests" rows:
  | payer | payee | amount | purpose |
  | Dee   | Bea   | 12.34  | food!   |
  And count "txs" is 0

Rule: A charger can undo a charge from its summary

Scenario: A company charges an individual, then thinks twice about undoing it, then undoes it
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 1234.50      | food!             |
  And click "btn-submit"
  And click "btn-undo"
  Then text "messageText": "Reverse the transaction?"

  When click "btn2"
  Then see "tx-summary"
  And see "btn-undo"

  When click "btn-undo"
  And click "btn1"
  Then on page ""
  And text "msg": "The transaction has been reversed."
  And count "txs" is 0

Rule: The amount must be a whole number of cents

Scenario: A cashier enters too many decimal places (to be rounded up)
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 1.235        | food!             |
  And click "btn-submit"
  Then text "messageText": "The amount has been rounded to two decimal places. Make sure this is what you intended and try again."
  And on page "tx"
  And text "input-amount": "1.24"
  And count "txs" is 0

Scenario: A cashier enters too many decimal places (to be rounded down)
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 1.234        | food!             |
  And click "btn-submit"
  Then text "input-amount": "1.23"
  And count "txs" is 0

Rule: A charge cannot exceed what the buyer has or the app's limit

Scenario: The buyer has no balance and no credit
  Given these "users" rows:
  | uid | balance | floor |
  | Dee | -23     | 0     |
  And signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  Then on page ""
  And see "notice-error"
  And text "msg": "This account has no remaining funds, so a transaction is not possible at this time."

Scenario: The buyer has a balance, but not enough (a credit line needs a connected bank account, which the test accounts lack)
  Given these "users" rows:
  | uid | balance | floor |
  | Dee | 23      | -4    |
  And signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 30           | food!             |
  And click "btn-submit"
  Then text "messageText": "This transaction is limited to $23.00."
  And on page "tx"
  And count "txs" is 0

Scenario: The buyer has plenty, but the charge is more than the app allows
  Given these "users" rows:
  | uid | balance | floor |
  | Dee | 9999    | -9999 |
  And signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 20000        | food!             |
  And click "btn-submit"
  Then text "messageText": "CGPay transactions are limited to $10,000.00"
  And on page "tx"
  And count "txs" is 0
