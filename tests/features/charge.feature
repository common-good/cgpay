@charge
Feature: Charge
  As a vendor or individual
  I can charge another CGPay user for a specified amount 
  So that funds are deducted from their account and added to mine.

Background:
 * context

Rule: Charges must include an amount and a description

Scenario: I am charging another user
  When I charge another user
  Then ? I must enter a charge amount and description

Scenario: I charge another user
  When I charge a user
  Then ? The app deducts the amount from other user's account with the description I entered
  
Scenario: I charge another user
  When I charge a user
  Then ? The shows a confirmation that the charge was successful

Scenario: I charge another user
  When I charge a user
  Then ? The app provides a way for me to undo the charge