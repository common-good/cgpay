@all @signin
Feature: Sign In
  As a vendor or individual
  I can sign in to the CGPay app
  So that I can use it to pay and charge other users.

Background:
  When I visit "sign-in"

Rule: Users sign in to use the app

Scenario: I can sign in to CGPay
  Then ? I see "signin-btn"

Scenario: I can access a sign-up link from the sign-in page
  Then ? I see "signup-btn"

Rule: I can reset my password from the sign-in page
  Then ? I see a "reset-pw"
