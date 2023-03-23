@shortcut
Feature: Add to Home Screen
  As a vendor or individual
  I can add the CGPay app to my mobile home screen
  So it functions as an app and is easy to access.

Background:
  * context
 
Rule: When a user visits the app site on mobile for the first time, we show instructions.

Scenario: On an Apple device I see instructions to add the app to my home screen.
  Given I use "Safari" on an "Apple" device
  When I run the app
  Then ? I am on page "add-to-home-screen"
  And ? I see installation instructions for "apple"

Scenario: On an Android device I see instructions to add the app to my home screen.
  Given I use "Chrome" on an "Android" device
  When I run the app
  Then ? I am on page "add-to-home-screen"
  And ? I see installation instructions for "android"

Rule: When not on a mobile device, the instruction page is automatically skipped.

Scenario: On a desktop computer I see no such instructions.
  Given I use "Chrome" on an "other" device
  When I run the app
  Then ? I am on page "sign-in"

Rule: If the user continues past the instructions, we show the Sign In screen.

Scenario: I click continue and am directed to the Sign In screen.
  Given I use "Chrome" on an "Android" device
  When I run the app
  And I click "continue-button"
  Then ? I am on page "sign-in"

Rule: If the user continues past the instructions, we don't show them again.

# This test is failing
Scenario: I click continue and am not shown the instructions again.
  Given I use "Chrome" on an "Android" device
  When I run the app
  And I click "continue-button"
  And I run the app
  Then ? I am on page "sign-in"
