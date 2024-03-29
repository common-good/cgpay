@all @signin
Feature: Sign In
  As a vendor or individual
  I can sign in to the CGPay app
  So that I can use it to pay and charge other users.

Background:
  Given this "sawAdd": "now"

Rule: Users have options to sign in, sign up, or reset password -- all on one page
@a 
Scenario: A user visits the Sign-in page
  When I run the app
  Then ? I see "btn-signin"
  And ? I see "lnk-signup"
  And ? I see "lnk-reset"
@a
Scenario: A user with one account signs in
  When I run the app
  And I input "d" as "identifier"
  And I input "k" as "password"
  And I click "btn-signin"
  And I wait 2 seconds
  Then ? I am on page "home"
  And ? I am signed in as "Dee"

Scenario: A user with multiple accounts signs in
  When I run the app
  * I wait .2 seconds
  And I input "a" as "identifier"
  And I input "k" as "password"
  And I click "btn-signin"
  And I wait 2 seconds
  Then ? I am on page "link-account"
  And ? these choices:
  | Abe | Abe/Cit |

Rule: We give an error message if the user tries to sign in offline
@a
Scenario: A user tries to sign in offline
  Given we are offline
  When I run the app
  And I wait 1 seconds
  And I input "a" as "identifier"
  And I input "k" as "password"
  And I click "btn-signin"
  And I wait 2 seconds
  Then ? this error: "Check your internet connection"
