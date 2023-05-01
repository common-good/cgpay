@all @timeout
Feature: Timeout
  As a vendor or user in self-serve mode
  I can have the app return to home on its own after confirming a payment
  So I don't have to worry about the payment accidentally being undone

  NOTE: test timeout (set in constants.js) is set to 0.7 seconds

Background:
  * I am signed in as "Abe/Cit"
  * this "payOk": "self"
  * I charge "Bea" 1.23 for "candy"

Rule: If nothing happens soon after payment confirmation, the app goes home

Scenario: Nothing happens soon after payment confirmation
  Given I wait 2 seconds
  Then ? I am on page "home"

Rule: If something happens soon after payment confirmation, the app does not time signOut
@this
Scenario: The user clicks Undo
  Given I wait 0.5 seconds
  When I click "btn-undo"
  Then ? I see "btn1"
  When I wait 2 seconds
  Then ? I see "btn1"

Scenario: The user starts another transaction right away
  Given I wait 0.5 seconds
  And I click "done"
  When I click "btn-charge"
  And I wait 2 seconds
  Then ? I am on page "scan"
