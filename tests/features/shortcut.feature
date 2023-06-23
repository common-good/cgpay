@all @a @shortcut
Feature: Add to Home Screen
  As a vendor or individual
  I can add the CGPay app to my mobile home screen
  So it functions as an app and is easy to access.

Background:
 
Rule: When a user visits the app site on mobile for the first time, we show instructions.

Scenario: On an Apple device I see instructions to add the app to my home screen.
  Given I use "Safari" on an "Apple" device
  When I run the app
  Then ? I am on page "add-to-home-screen"
  And ? I see "apple-instructions"

Scenario: On an Android device I see instructions to add the app to my home screen.
  Given I use "Chrome" on an "Android" device
  When I run the app
  Then ? I am on page "add-to-home-screen"
  And ? I see "android-instructions"

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

Scenario: I click continue and can expect not to see the instructions again.
  Given I use "Chrome" on an "Android" device
  When I run the app
  Then ? I am on page "add-to-home-screen"
  When I click "continue-button"
  Then ? this "sawAdd": "now"

Scenario: I clicked continue so I don't see the instructions again.
  Given this "sawAdd": "now"
  When I run the app
  Then ? I am on page "sign-in"

Rule: If we go offline when the user is adding to home screen, the user can still click continue

Scenario: We go offline right after a user runs the app
  Given I use "Chrome" on an "Android" device
  When I run the app
  And we are offline
  When I click "continue-button"
  Then ? I am on page "sign-in"