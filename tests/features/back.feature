@all @b @back
Feature: Go Back
  As an individual member or member company
  I can click the back button to go to a previous page when possible
  So I can correct an omission or error

Implicit Background: see features/background.txt

Background:

Rule: No back button on sign-in, link-account, or home page

Scenario: On sign-in page
  When I visit "sign-in"
  Then ? I see no "btn-back"
  And ? I see no "btn-nav"

Scenario: On link-account page
  Given these choices:
  | Abe | Abe/Cit |
  When I visit "link-account"
  Then ? I see no "btn-back"
  But ? I see "btn-nav"

Scenario: On home page
  Given I am signed in as "Bea"
  When I visit "home"
  Then ? I see no "btn-back"
  But ? I see "btn-nav"

Rule: Back button on transaction completed page means undo

Scenario: A user completes a transaction and goes back
  Given I am signed in as "Bea"
  And I charge "Abe" 12.34 for "lunch"
  Then ? I see "btn-back"
  And ? I see "btn-nav"

  When I click "btn-back"
  Then ? this confirmation: "Reverse the transaction?"

Scenario: A user comments after completing a transaction
  Given I am signed in as "Bea"
  And I charge "Abe" 12.34 for "lunch"
  Then ? this "pending": "true"

  When I click "btn-nav"
  And I click "menu-comment"
  Then ? this "pending": "false"

  When I click "btn-back"
  Then ? I am on page "home"

Rule: Everywhere else clicking the back button sends you to the previous page in a workable state

Scenario: On scan page
  Given I am signed in as "Bea"
  And I run the app
  And I click "btn-charge"
  When I click "btn-back"
  Then ? I am on page "home"
  And ? I see no "btn-back"

Scenario: On tx page
  Given I am signed in as "Bea"
  And I scan "Abe" to "charge"
  When I click "btn-back"
  Then ? I am on page "scan"
  When I click "btn-back"
  Then ? I am on page "home"

Scenario: On comments page from home page
  Given I am signed in as "Bea"
  And I run the app
  And I click "btn-nav"
  And I click "menu-comment"
  When I click "btn-back"
  Then ? I am on page "home"

Scenario: On comments page from scan page
  Given I am signed in as "Bea"
  And I run the app
  And I click "btn-charge"
  And I click "btn-nav"
  And I click "menu-comment"
  When I click "btn-back"
  Then ? I am on page "scan"
  When I click "btn-back"
  Then ? I am on page "home"

Scenario: On comments page from tx page
  Given I am signed in as "Bea"
  And I scan "Abe" to "charge"
  And I click "btn-nav"
  And I click "menu-comment"
  When I click "btn-back"
  Then ? I am on page "tx-details"
  When I click "btn-back"
  Then ? I am on page "scan"
  When I click "btn-back"
  Then ? I am on page "home"

Scenario: On comments page from tx page back and forth
  Given I am signed in as "Bea"
  And I scan "Abe" to "charge"
  And I click "btn-nav"
  And I click "menu-comment"
  When I click "btn-back"
  Then ? I am on page "tx-details"
  When I input "1234.50" as "amount"
  And I input "food!" as "description"
  And I click "btn-submit"
  * I wait 1 seconds
  Then ? I see "transaction-complete"
