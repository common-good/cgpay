Feature: Sign in
  As a member
  I can sign in to cgpay with my account ID and password
  So that I can see my account

Background:
  Given signed in as "nobody"

Rule: A member signs in with the right password and is turned away with a wrong one

Scenario: Someone runs the app, not signed in
  Then on page "login"
  And I see "btn-signin"
  And I see "lnk-signup"
  And I see "lnk-reset"

Scenario: A member signs in
  When I input "Bea Two" as "identifier"
  And I input "k" as "password"
  And I click "btn-signin"
  Then on page "dashboard"
  And signed in as "Bea"

Scenario: Someone tries to sign in with a wrong password
  When I input "Bea Two" as "identifier"
  And I input "badpw" as "password"
  And I click "btn-signin"
  Then I see error "Invalid account ID or password."
  And I am on page "login"
  And signed in as "nobody"

Scenario: Someone who forgot their password asks for a new one
  When I click "lnk-reset"
  Then on PHP page "settings/password"
