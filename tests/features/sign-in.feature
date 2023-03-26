@all @signin
Feature: Sign In
  As a vendor or individual
  I can sign in to the CGPay app
  So that I can use it to pay and charge other users.

Background:
 * context

Rule: Users sign in to use the app

Scenario: I sign in to CGPay
  When I sign in
  Then ? I am directed to the homepage
