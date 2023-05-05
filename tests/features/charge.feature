@all @b @charge
Feature: Charge
  As a company or individual
  I can charge another CGPay user for a specified amount 
  So that funds are deducted from their account and added to mine.

  NOTE: Use an exclamation mark at the end of the transaction description, to tell the server
        not to give a warning for duplicate transactions. For example, "food!".

Background:
  * I am signed in as "Abe/Cit"

Rule: Charges must include an amount and a description

Scenario: A company charges an individual
  When I scan "Bea" to "charge"
  And I input "1234.50" as "amount"
  And I input "food!" as "description"
  And I click "btn-submit"
  Then ? I see "transaction-complete"
  And these "txs":
  | deviceId | amount   | actorId | otherId | description | created | proof | offline | version |
  | devC     | 1234.50  | Abe/Cit | Bea     | food!       | now     | hash  | true    | version |
  And ? this "pending": "true"
  And ? "action" is "Charged"
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
  | amt     | actorId | uid1 | uid2  | agt1 | agt2 | for2  | created | 
  | 1234.50 | Cit     | Bea  | Cit   | Bea  | Abe  | food! | now     |

Scenario: A company charges an individual then undoes the transaction-*
  # abbreviated syntax for first 4 steps
  When I charge "Bea" 1234.50 for "food!"
  Then ? I see "transaction-complete"
  And these "txs":
  | deviceId | amount   | actorId | otherId | description | created | proof | offline | version |
  | devC     | 1234.50  | Abe/Cit | Bea     | food!       | now     | hash  | true    | version |

  When I click "btn-undo"
  Then ? I am on page "tx"
  And ? this alert: "Reverse the transaction?"
  And ? this "pending": "true"
  And ? "btn1" is "Yes"
  And ? "btn2" is "No"
  When I click "btn2"
  Then ? I am on page "tx"
  And ? I see "btn-undo"
  And ? this "pending": "true"
  
  When I click "btn-back"
  Then ? I am on page "tx"
  And ? this alert: "Reverse the transaction?"
  And ? this "pending": "true"
  And ? "btn1" is "Yes"
  And ? "btn2" is "No"
  When I click "btn2"
  Then ? I am on page "tx"
  And ? I see "btn-undo"
  And ? this "pending": "true"

  When I click "btn-undo"
  And I click "btn1"
  Then ? this confirmation: "The transaction has been reversed."
  And ? this "pending": "false"
  And ? count "txs" is 0
  And ? I am on page "home"
  * we wait for uploads
  Then ? count "txs" is 0

Scenario: A company charges a company
  When I charge "Flo/Gis" 1234.50 for "food!"
  Then ? I see "transaction-complete"
  And ? this "pending": "true"
  And ? "action" is "Charged"
  And ? "other-name" is "Gisette"
  And ? "agent" is "Flo Six"
  And ? "description" is "food!"
  And ? "amount" is "1,234.50"
  And ? I see "thank-you"
  And ? I see "btn-undo"

Scenario: An individual charges an individual
  Given I am signed in as "Abe"
  When I charge "Bea" 1234.50 for "food!"
  Then ? I see "transaction-complete"
  And ? this "pending": "true"
  And ? "action" is "Charged"

Scenario: A company charges an individual offline
  Given we are offline
  And I run the app
  When I scan "Bea" to "charge"
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
  Then ? I see "transaction-complete"
  And ? "action" is "Charged"
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
