@nyi @b @self
Feature: Self Serve Mode
 As a vendor
 I can set the CGPay app to Self Serve mode
 So that customers can use it to charge themselves without having administrative privileges.

Background:

Rule: Business accounts have the option to enter self-serve mode

Scenario: A business account sees self-serve mode
  Given I am signed in as "Abe/Cit"
  And I run the app
  When I click "btn-nav"
  Then ? I see "menu-selfOn"
  And ? I do not see "menu-selfOff"

Rule: The only menu option in self-serve mode is to exit self-serve mode and sign out

Scenario: A business account chooses self-serve mode
  Given I am signed in as "Abe/Cit"
  And I run the app
  Then ? this "selfServe": "false"

  When I click "btn-nav"
  And I click "menu-selfOn"
  Then ? this "selfServe": "true"

  When I click "btn-nav"
  Then ? I see "menu-selfOff"
  And ? I do not see "menu-selfOn"
  And ? I do not see "menu-front"
  And ? I do not see "menu-rear"
  And ? I do not see "menu-switch"
  And ? I do not see "menu-comment"
  And ? I do not see "menu-signout"

Rule: In self-serve mode, no photo or customer name or location is shown

Scenario: A customer scans in self-serve mode
  Given I am signed in as "Abe/Cit"
  And this "selfServe": "true"
  When I scan "Bea"
  Then ? I am on page "tx"
  And ? I do not see "theirPhoto"
  And ? I do not see "theirLocation"

Rule: In self-serve mode, communication is directed at the buyer, not the seller

Scenario: A customer pays in self-serve mode
  Given I am signed in as "Abe/Cit"
  And this "selfServe": "true"
  When I scan "Bea"
  Then ? "action" is "Pay"
  And ? "btn-submit" is "Pay"

  When I input "1234.50" as "amount"
  And I input "food!" as "description"
  And I click "btn-submit"
  Then ? we post this to "transactions":
  | amount  | actorId | otherId | description | created | proof | offline | version |
  | 1234.50 | Abe/Cit | Bea     | food!       | now     | hash  | false   | version |
  * I wait 1 seconds
  Then ? I see "transaction-complete"
  And ? "action" is "Paid"
  And ? "other-name" is "Citre"
  And ? I do not see "agent"
  And ? "description" is "food!"
  And ? "amount" is "1,234.50"
  And ? I see "thank-you"
  And ? I see "btn-undo"

Rule: Exiting self-serve mode signs the user out

Scenario: A vendor (or customer) exits self-serve mode
  Given I am signed in as "Abe/Cit"
  And this "selfServe": "true"
  And I run the app
  When I click "btn-nav"
  And I click "menu-selfOff"
  Then ? this "myAccount": "null"
  And ? I am on page "sign-in"

Rule: Individual accounts have no self-serve mode
  Given I am signed in as "Bea"
  And I run the app
  When I click "btn-nav"
  Then ? I do not see "menu-selfOn"
  And ? I do not see "menu-selfOn"
