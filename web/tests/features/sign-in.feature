Feature: Sign in
  As a member
  I can sign in to cgpay with my account ID and password
  So that I can see my account

Background:
  Given signed in as "nobody"

Rule: A member signs in with the right password and is turned away with a wrong one

Scenario: Someone runs the app, not signed in
  Then on page "login"
  And see "btn-signin"
  And see "lnk-signup"
  And see "lnk-reset"
  And see "topnav"

Scenario: In the store app the sign-in page shows the brand once and fills the screen
  Given in the store app
  Then on page "login"
  And see not "topnav"
  And see "btn-signin"

Scenario: A member signs in
  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  Then on page ""
  And signed in as "Bea"

Scenario: Someone tries to sign in with a wrong password
  When input:
  | identifier | password |
  | Bea Two    | badpw    |
  And click "btn-signin"
  Then error "Invalid account ID or password."
  And on page "login"
  And signed in as "nobody"

Scenario: Someone who forgot their password asks for a new one
  When click "lnk-reset"
  Then on page "reset"

Rule: The sign-in page is ready to type into, and the reset link is the last tab stop

Scenario: Someone tabs through the sign-in page
  Then focus on "identifier"

  When press "Tab" 4 times
  Then focus on "lnk-reset"
