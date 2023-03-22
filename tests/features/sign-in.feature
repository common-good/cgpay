Feature: Sign In
  As a vendor or individual
  I can sign in to the CGPay app
  So that I can use it to pay and charge other users.

Background:
 * context

Rule: Users sign in to use the app

Scenario: I sign in to CGPay for the first time
  When I sign in
  And I have not set a linked account
  Then ? I am on link account page

Scenario: I sign in to CGPay after having a linked account
  When I sign in
  And I have a linked account
  Then ? I am on page homepage
