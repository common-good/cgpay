@all @feedback
Feature: Feedback
  As a vendor or individual
  I can submit feedback and comments about CGPay from the app
  So that I know my user experience is valued.

Background:

Scenario: I am signed in and not in Self Serve mode
  When I am signed in 
  Then ? The app displays a menu item to submit feedback

Scenario: I submit feedback
  When I submit feedback
  Then ? The app sends the feedback to the system admin

Scenario: I submit feedback
  When I submit feedback
  Then ? The app displays a thank you message to confirm the feedback was received
