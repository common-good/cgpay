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
  When I scan "Bea"
  And I input "1234.50" as "amount"
  And I input "food!" as "description"
  And I click "btn-submit"
  Then ? we post this to "transactions":
  | amount  | actorId | otherId | description | created | proof                          | offline | version |
  | 1234.50 | Abe/Cit | Bea     | food!       | now     | actorId,amount,otherId,created | false   | version |
  * I wait 1 seconds
  Then ? I see "transaction-complete"
  And ? I see "action" is "Charged"
  And ? I see "other-name" is "Bea Two"
  And ? I do not see "agent"
  And ? I see "description" is "food!"
  And ? I see "amount" is "1,234.50"
  And ? I see "thank-you"
  And ? I see "btn-undo"
  And ? count "txs" is 0
  And ? these server "txs":
  | amt     | actorId | uid1 | uid2  | agt1 | agt2 | for2  | created | 
  | 1234.50 | Cit     | Bea  | Cit   | Bea  | Abe  | food! | now     |

  When I click "btn-undo"
  Then ? I see this alert: "Reverse the transaction?"
  And ? I see "btn1" is "Yes"
  When I click "btn1"
  * I wait 1 seconds
  Then ? I see this confirmation: "The transaction has been reversed."
  When I click "btn1"
  Then ? I am on page "home"
  * we wait for uploads
  Then ? count "txs" is 0
  And ? these server "txs":
  | amt      | actorId | uid1 | uid2  | agt1 | agt2 | for2  | created | 
  | -1234.50 | Cit     | Bea  | Cit   | Bea  | Abe  | food! | now     |

Scenario: A company charges a company
# abbreviated syntax for first 4 steps
  When I charge "Flo/Gis" 1234.50 for "food!"
  Then ? we post this to "transactions":
  | amount  | actorId | otherId | description | created | proof                          | offline | version |
  | 1234.50 | Abe/Cit | Flo/Gis | food!       | now     | actorId,amount,otherId,created | false   | version |
  * I wait 1 seconds
  Then ? I see "transaction-complete"
  And ? I see "action" is "Charged"
  And ? I see "other-name" is "Gisette"
  And ? I see "agent" is "Flo Six"
  And ? I see "description" is "food!"
  And ? I see "amount" is "1,234.50"
  And ? I see "thank-you"
  And ? I see "btn-undo"
  And ? count "txs" is 0

Scenario: An individual charges an individual
  Given I am signed in as "Abe"
  When I charge "Bea" 1234.50 for "food!"
  Then ? we post this to "transactions":
  | amount  | actorId | otherId | description | created | proof                          | offline | version |
  | 1234.50 | Abe     | Bea     | food!       | now     | actorId,amount,otherId,created | false   | version |
  * I wait 1 seconds
  Then ? I see "transaction-complete"
  And ? I see "action" is "Charged"
