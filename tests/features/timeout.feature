@all @timeout
Feature: Timeout
  As a vendor or as a user in selfServe mode
  I can have the app return to home on its own after confirming a payment
  So I don't have to worry about the payment accidentally being undone

  NOTE: test timeout (set in constants.js) is set to 0.7 seconds

Background:
  * I am signed in as "Abe/Cit"
  * I charge "Bea" 1.23 for "candy"

Rule: If nothing happens soon after payment confirmation, the app goes home

Scenario: Nothing happens soon after payment confirmation
  Given I wait 2 seconds
  * snap
  Then ? I am on page "home"

Rule: If something happens soon after payment confirmation, the app does not time signOut

Scenario: The user chooses a menu item from the confirmation page
  Given I wait 0.5 seconds
  When I click "btn-nav"
  And I click "menu-comment"
  And I wait 2 seconds
  Then ? I am on page "comment"

Scenario: The user starts another transaction right away
  Given I wait 0.5 seconds
  And I click "done"
  When I click "btn-charge"
  And I wait 2 seconds
  Then ? I am on page "scan"
