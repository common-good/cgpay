Feature: Sign In

Background:
 * context

Rule: Users sign in to use the app

Scenario: I sign in to CGPay
  When I sign in 
  Then ? The app validates my credentials and signs me in

Scenario: I forgot my password
  When I forgot my password
  Then ? The app provides a link to reset password