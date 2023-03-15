Feature: Add to Home Screen
  As a vendor or individual
  I can add the CGPay app to my mobile home screen
  So it functions as an app and is easy to access.

Background:
 
Rule: When a user visits the app site on mobile for the first time, we show instructions.

Scenario: On an Apple device I see instructions to add the app to my home screen.
  Given my device is "Apple" 
  When I visit "/"
  Then ? I see installation instructions for "Apple"

Scenario: On an Android device I see instructions to add the app to my home screen.
  Given my device is "Android" 
  When I visit "/"
  Then ? I see installation instructions for "Android"

Rule: When not on a mobile device, the instruction page is automatically skipped.

Scenario: On a desktop computer I see no such instructions.
  Given my device is "Desktop"
  When I visit "/"
  Then ? I am on page "Signin"

Rule: If the user continues past the instructions, we show the Signin screen.
  Given my device is "Android" 
  When I visit "/"
  And I click "continue-button"
  Then ? I am on page "Signin"

Rule: If the user continues past the instructions, we don't show them again.
  Given my device is "Android" 
  When I visit "/"
  And I click "continue-button"
  And I visit "/"
  Then ? I am on page "Signin"