@all @b @dash
Feature: Dashboard
  As an individual member or member company opting to show dashboard
  I see my balance and a list of recent transactions and requests when I launch the app or visit the home page
  So I can understand my financial situation and act accordingly

Implicit Background: see features/background.txt

Background:

Rule: Only individual account users see the dashboard, by default

Scenario: The device is linked to an individual account
  Given I am signed in as "Bea"
  And I charge "Abe" 12.34 for "lunch"
  And I pay "Citre" 56.78 for "groceries"
  When I visit "home"
  Then ? I see "btn-back"
  And ? I see "btn-nav"
