@a
Feature: Release A temporary restrictions and features
  As a vendor or individual
  I can use the CGPay app with a specific feature set
  So the tech team can get me a better and better app safely and quickly.

Background:

Rule: All users skip the link-account page

Scenario: A user with multiple accounts signs in
  When I visit "sign-in"
  Then ? I am on page "sign-in"
  When I input "a" as "identifier"
  And I input "k" as "password"
  And I click "btn-signin"
  Then ? I am on page "home"
  And ? these choices:
  | Abe | Abe/Citre |

Rule: Menu is limited

Scenario: The menu shows just Comment and Sign out
  Given I am signed in as "Abe"
  When I visit "home"
  Then ? I see "menu-comment"
  And ? I see "menu-signout"
  And ? I do not see "menu-switch"
  And ? I do not see "menu-rear"
  And ? I do not see "menu-front"
  And ? I do not see "menu-selfOff"
  And ? I do not see "menu-selfOn"

Rule: User sees a survey button instead of a Charge button
  When I visit "sign-in"
  Then ? I am on page "sign-in"
  And ? I see "lnk-survey"
  And ? I do not see "btn-charge"
