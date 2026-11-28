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

Rule: The amount is typed on a pad, filling in from the cents end, as on a cash register

Scenario: A cashier types an amount, corrects it and starts over
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  Then text "input-amount": "0.00"

  When pad "125"
  Then text "input-amount": "1.25"

  When pad "b7"
  Then text "input-amount": "1.27"

  When pad "c"
  Then text "input-amount": "0.00"

Scenario: A cashier uses a keyboard for the amount and presses Enter
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input "input-description": "food!"
  And pad "1"
  And type "250"
  And press "Enter"
  Then see "tx-summary"
  And text "amount": "12.50"

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

Scenario: The buyer has a balance and a credit line, but no connected bank account, so the credit line does not count
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

Scenario: The buyer has a balance and a credit line with a connected bank account, but not enough
  Given these "users" rows:
  | uid | balance | floor | bankAccount              |
  | Dee | 23      | -4    | USkk21187028101234567890 |
  And signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 30           | food!             |
  And click "btn-submit"
  Then text "messageText": "This transaction is limited to $27.00."
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

Rule: A company's descriptions are offered as choices, the first one chosen

Scenario: A company picks another description from its list
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  Then text "input-description": "groceries"
  And see "desc-3"

  When click "desc-2"
  And input "input-amount": "12.34"
  And click "btn-submit"
  And click "btn-done"
  Then these "txs" rows:
  | uid1 | uid2 | agt1 | agt2 | amt   | for2  |
  | Dee  | Cit  | Dee  | Bea  | 12.34 | gifts |

Scenario: An account with no description list offers no choices
  Given signed in as "Bea"
  When scan "Dee" to "charge"
  Then see "input-description"
  And see not "desc-choices"

Rule: The same transaction again within 3 minutes asks first, since the server cannot warn until it is too late

Scenario: A cashier charges the same member the same amount again, and goes ahead
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 12.34        | food              |
  And click "btn-submit"
  And click "btn-done"
  And scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 12.34        | food              |
  And click "btn-submit"
  Then see "messageText"

  When click "btn1"
  And click "btn-done"
  Then count "txs" is 2

Scenario: A cashier charges the same member the same amount again, and stops
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 12.34        | food              |
  And click "btn-submit"
  And click "btn-done"
  And scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 12.34        | food              |
  And click "btn-submit"
  And click "btn2"
  Then on page "tx"
  And count "txs" is 1

Scenario: An undone transaction does not count as a repeat
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 12.34        | food              |
  And click "btn-submit"
  And click "btn-undo"
  And click "btn1"
  And scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 12.34        | food              |
  And click "btn-submit"
  Then see "tx-summary"

Rule: An exchange for cash is marked as one, not as a purchase, and is limited to what the customer can cash out

Scenario: A company charges an individual for cash
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And click "cash"
  Then text "input-description": "cash"

  When input "input-amount": "20"
  And click "btn-submit"
  And click "btn-done"
  Then these "txs" rows:
  | uid1 | uid2 | agt1 | agt2 | amt   | goods |
  | Dee  | Cit  | Dee  | Bea  | 20.00 | 1     |

Scenario: A cashier cannot give more cash than the customer can cash out, though the customer could buy that much
  Given these "users" rows:
  | uid | balance | floor | bankAccount              |
  | Dee | 23      | -4    | USkk21187028101234567890 |
  And signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And click "cash"
  And input "input-amount": "25"
  And click "btn-submit"
  Then text "messageText": "This transaction is limited to $23.00."
  And count "txs" is 0

Rule: After a charge the cashier sees the customer's new balance, unless the customer keeps it secret

Scenario: A company charges an individual and sees the new balance
  Given these "users" rows:
  | uid | balance |
  | Dee | 100     |
  And signed in as "Bea"
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 12.34        | food!             |
  And click "btn-submit"
  And click "btn-done"
  Then see "notice-info"
  And text "msg": "Dee Four's balance is now $87.66."

Rule: The last transaction can still be undone for 15 minutes after it was sent, from the app's home screen

Scenario: A company charges an individual, then undoes the charge after it was sent
  Given signed in as "Bea"
  And in the store app
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 12.34        | food!             |
  And click "btn-submit"
  And click "btn-done"
  Then count "txs" is 1

  When click "nav-app"
  And click "btn-undo-last"
  And click "btn-undo-yes"
  Then see "notice"
  And see not "btn-undo-last"
  And count "txs" is 2

Scenario: After 15 minutes the app no longer offers to undo
  Given signed in as "Bea"
  And in the store app
  And acting as "Cit"
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 12.34        | food!             |
  And click "btn-submit"
  And click "btn-done"
  And click "nav-app"
  Then see "btn-undo-last"

  When wait 960 seconds
  Then see not "btn-undo-last"
