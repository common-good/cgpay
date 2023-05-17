@nyi @b @self
Feature: Self Serve Mode
 As a vendor
 I can set the CGPay app to Self Serve mode
 So that customers can use it to charge themselves without having administrative privileges.

Background:

Rule: The only menu option in self-serve mode is to sign out

Scenario: A business account chooses self-serve mode
  Given I am signed in as "Abe/Cit"
  And this "payOk": "self"
  And I run the app
  When I click "btn-nav"
  Then ? I see "menu-selfOff"
  And ? I see no "menu-front"
  And ? I see no "menu-rear"
  And ? I see no "menu-switch"
  And ? I see no "menu-comment"
  And ? I see no "menu-signout"

Rule: In self-serve mode, no photo or customer name or location is shown

Scenario: A customer scans in self-serve mode
  Given I am signed in as "Abe/Cit"
  And this "payOk": "self"
  When I scan "Bea" to "charge"
  Then ? I am on page "tx-details"
  And ? I see no "theirPhoto"
  And ? I see no "theirLocation"

Rule: In self-serve mode, communication is directed at the buyer, not the seller

Scenario: A customer pays in self-serve mode
  Given I am signed in as "Abe/Cit"
  And this "payOk": "self"
  When I scan "Bea" to "charge"
  Then ? "action" is "Pay"
  And ? "btn-submit" is "Pay"

  When I input "1234.50" as "amount"
  And I input "food!" as "description"
  And I click "btn-submit"
  Then ? we post this to "transactions":
  | amount  | actorId | otherId | description | created | proof | offline | version |
  | 1234.50 | Abe/Cit | Bea     | food!       | now     | hash  | false   | version |
  * I wait .1 seconds
  Then ? I see "transaction-complete"
  And ? "action" is "Paid"
  And ? "other-name" is "Citre"
  And ? I see no "agent"
  And ? "description" is "food!"
  And ? "amount" is "1,234.50"
  And ? I see "thank-you"
  And ? I see "btn-undo"

Rule: Exiting self-serve mode signs the user out

Scenario: A vendor (or customer) exits self-serve mode
  Given I am signed in as "Abe/Cit"
  And this "payOk": "self"
  And I run the app
  When I click "btn-nav"
  And I click "menu-selfOff"
  Then ? this "myAccount": "null"
  And ? I am on page "sign-in"

Rule: Only business accounts have self-serve mode

Scenario: A member with multiple accounts has signed in
  Given these choices:
  | Bea   | Bea/Cit |
  When I visit "link-account"
  Then ? "account-opt-1" is "selected"
  And ? I see "payOk-radio-self"
  When I click "account-opt-0"
  Then ? I see no "payOk-radio-self"
