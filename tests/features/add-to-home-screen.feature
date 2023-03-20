Feature: Add to Home Screen
  As a vendor or individual
  I can add the CGPay app to my mobile home screen
  So it functions as an app and is easy to access.

Background:
  * context
 
Rule: When a user visits the app site on mobile for the first time, we show instructions.

Scenario: On an Apple device I see instructions to add the app to my home screen.
  Given my device is "Apple" 
  When I visit "/"
  Then ? I see installation instructions for "apple"

Scenario: On an Android device I see instructions to add the app to my home screen.
  Given my device is "Android" 
  When I visit "/"
  Then ? I see installation instructions for "android"

Rule: When not on a mobile device, the instruction page is automatically skipped.

Scenario: On a desktop computer I see no such instructions.
  Given my device is "Desktop"
  When I visit "/"
  Then ? the page title is "CGPay - Sign In"

Rule: If the user continues past the instructions, we show the Sign In screen.

Scenario: I click continue and am directed to the Sign In screen.
  When I visit "/"
  And I click "continue-button"
  Then ? the page title is "CGPay - Sign In"

Rule: If the user continues past the instructions, we don't show them again.

Scenario: I click continue and am not shown the instructions again.
  When I visit "/"
  And I click "continue-button"
  And I visit "/"
  Then ? the page title is "CGPay - Sign In"