@all @b @pay
Feature: Pay
  As a company or individual
  I can pay another CGPay user for a specified amount 
  So that funds are deducted from my account and added to theirs.

  NOTE: Use an exclamation mark at the end of the transaction description, to tell the server
        not to give a warning for duplicate transactions. For example, "food!".

Background:
  * I am signed in as "Abe/Cit"
  * this "payOk": "always"

Rule: Transactions must include an amount and a description
@this
Scenario: A company pays an individual
  When I scan "Bea" to "pay"
  And I input "1234.50" as "amount"
  And I input "food!" as "description"
  And I click "btn-submit"
  Then ? I see "tx-summary"
  And ? these "txs":
  | deviceId | amount   | actorId | otherId | description | created | proof | offline | version | pending |
  | devC     | -1234.50 | Abe/Cit | Bea     | food!       | now     | hash  | true    | version | false   |
  And ? this "pending": "true"
  And ? "action" is "Paid"
  And ? "other-name" is "Bea Two"
  And ? I see no "agent"
  And ? "description" is "food!"
  And ? "amount" is "1,234.50"
  And ? I see "thank-you"
  And ? I see "btn-undo"
  And ? I see "btn-done"
  
  When I click "btn-done"
  Then ? I am on page "home"
  And ? this "pending": "false"
  * we wait for uploads
  And ? these server "txs":
  | amt     | actorId | uid2 | uid1  | agt2 | agt1 | for1  | created | 
  | 1234.50 | Cit     | Bea  | Cit   | Bea  | Abe  | food! | now     |

Scenario: A company pays an individual then undoes the transaction
  # abbreviated syntax for first 4 steps
  When I pay "Bea" 1234.50 for "food!"
  Then ? I see "tx-summary"
  And these "txs":
  | deviceId | amount   | actorId | otherId | description | created | proof | offline | version |
  | devC     | -1234.50 | Abe/Cit | Bea     | food!       | now     | hash  | true    | version |

  When I click "btn-undo"
  Then ? I see "tx-summary"
  And ? this alert: "Reverse the transaction?"
  And ? this "pending": "true"
  And ? "btn1" is "Yes"
  And ? "btn2" is "No"

  When I click "btn2"
  Then ? I am on page "tx-details"
  And ? I see "btn-undo"
  And ? this "pending": "true"
  
  When I click "btn-back"
  Then ? I am on page "tx-details"
  And ? this alert: "Reverse the transaction?"
  And ? this "pending": "true"
  And ? "btn1" is "Yes"
  And ? "btn2" is "No"

  When I click "btn2"
  Then ? I am on page "tx-details"
  And ? I see "btn-undo"
  And ? this "pending": "true"

  When I click "btn-undo"
  Then ? this alert: "Reverse the transaction?"
  And ? "btn1" is "Yes"

  When I click "btn1"
  Then ? this confirmation: "The transaction has been reversed."
  And ? I am on page "home"
  And ? count "txs" is 0
  And ? this "pending": "false"
  * we wait for uploads
  Then ? count "txs" is 0

Scenario: A company pays a company
  When I pay "Flo/Gis" 1234.50 for "food!"
  Then ? I see "tx-summary"
  And ? this "pending": "true"
  And ? "action" is "Paid"
  And ? "other-name" is "Gisette"
  And ? "agent" is "Flo Six"
  And ? "description" is "food!"
  And ? "amount" is "1,234.50"
  And ? I see "thank-you"
  And ? I see "btn-undo"

  When I click "btn-done"
  Then ? I am on page "home"
  And ? this "balance": "8764.50"
  And ? count "recentTxs" is 1
  And ? I see "tx-pending" is "(pending)"

Scenario: An individual pays an individual
  Given I am signed in as "Abe"
  When I pay "Bea" 1234.50 for "food!"
  Then ? I see "tx-summary"
  And ? this "pending": "true"
  And ? "action" is "Paid"
  And ? "other-name" is "Bea Two"
  And ? "agent" is ""
  And ? "description" is "food!"
  And ? "amount" is "1,234.50"
  And ? I see "thank-you"
  And ? I see "btn-undo"

Scenario: A company pays an individual offline
  Given we are offline
  And I run the app
  Then ? this "useWifi": "false"
  And ? this "online": "false"
  When I scan "Bea" to "pay"
  Then ? this alert: "Trust this member or ask for ID"
  When I click "btn1"
  * I wait .2 seconds
  And I input "234.50" as "amount"
  And I input "food!" as "description"
  And I click "btn-submit"
  Then ? these "txs":
  | deviceId | amount | actorId | otherId | description | created | offline | version |
  | devC     | 234.50 | Abe/Cit | Bea     | food!       | now     | true    | version |
  # Offline limit is $250
  Then ? I see "tx-summary"
  And ? "action" is "Paid"
  And ? "other-name" is "Unidentified Member"
  And ? I see no "agent"
  And ? "description" is "food!"
  And ? "amount" is "234.50"
  And ? I see "thank-you"
  And ? I see "btn-undo"
  And ? count "txs" is 1

  When I click "btn-undo"
  Then ? this alert: "Reverse the transaction?"
  And ? "btn1" is "Yes"
  When I click "btn1"
  Then ? I am on page "home"
  Then ? this confirmation: "The transaction has been reversed."
  And ? count "txs" is 0

Scenario: A cashier enters too many decimal places (to be rounded up)
  When I pay "Bea" 1.235 for "food!"
  Then ? this alert: "The amount has been rounded to two decimal places. Make sure this is what you intended and try again."
  And ? I am on page "submit-charge"
  And ? "input-amount" is "1.24"
  And ? count "txs" is 0

Scenario: A cashier enters too many decimal places (to be rounded down)
  When I pay "Bea" 1.234 for "food!"
  Then ? this alert: "The amount has been rounded to two decimal places. Make sure this is what you intended and try again."
  And ? I am on page "submit-charge"
  And ? "input-amount" is "1.23"
  And ? count "txs" is 0

Scenario: A buyer has no balance and no credit
  Given these server "accounts" values:
  | id  | balance | creditLine |
  | Dee | -23     | 0          |
  And I am signed in as "Abe/Cit"
  When I scan "Dee" to "pay"
  Then ? this alert: "This account has no remaining funds"
  And ? I am on page "home"

Scenario: A buyer has a balance, but not enough
  Given these server "accounts" values:
  | id  | balance | creditLine |
  | Dee | 23      | 4          |
  And I am signed in as "Abe/Cit"
  When I pay "Dee" 30.00 for "food!"
  Then ? this alert: "This transaction is limited to $27"
  And ? I am on page "submit-charge"
  And ? count "txs" is 0

Scenario: A buyer has plenty, but tries to pay more than the app allows
  Given these server "accounts" values:
  | id  | balance | creditLine |
  | Dee | 9999    | 9999       |
  And I am signed in as "Abe/Cit"
  When I pay "Dee" 20000.00 for "food!"
  Then ? this alert: "CGPay transactions are limited to $10,000"
  And ? I am on page "submit-charge"
  And ? count "txs" is 0
