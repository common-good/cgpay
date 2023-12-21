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
  * snap
  And I charge "Abe" 12.34 for "lunch"
#  And I pay "Cit" 56.78 for "groceries"
  When I visit "home"
  Then ? I see no "btn-back"
  And ? I see "btn-nav"
  And ? "name" is "Abe One"
  And ? "amt" is "12.34"
  And ? I see "tx-pending"
  And ? "description" is "lunch"
  And ? I see no "extra"
  
Scenario: The device is linked to a company account
  Given I am signed in as "Abe/Cit"
  And this "payOk": "always"
  Given I charge "Abe" 12.34 for "lunch"
  And I visit "home"
  And I pay "Bea" 56.78 for "groceries"
  When I visit "home"
  Then ? I see no "btn-back"
  And ? I see "btn-nav"
  And ? I see no "name"
  And ? I see no "amt"
  And ? I see no "description"

Rule: If the default setting is changed, Dashboard can be shown or hidden accordingly

Scenario: The device is linked to an individual account hiding dashboard
  Given I am signed in as "Bea"
  And this "showDash": "false"
  And I charge "Abe" 12.34 for "lunch"
  And I visit "home"
  And I pay "Cit" 56.78 for "groceries"
  When I visit "home"
  Then ? I see no "name"
  And ? I see no "amt"
  And ? I see no "description"

Scenario: The device is linked to a company account showing dashboard
  Given I am signed in as "Abe/Cit"
  And this "showDash": "true"
  Given I charge "Abe" 12.34 for "lunch"
#  And I visit "home"
#  And I pay "Bea" 56.78 for "groceries"
  When I visit "home"
  * snap
  Then ? "name" is "Abe One"
  And ? "amt" is "12.34"
  And ? I see no "tx-pending"
  And ? "description" is "lunch"
  And ? I see no "extra"

Rule: Dashboard gets updated when a transaction is made offline

Scenario: An individual transaction offline updates the dashboard
  Given I am signed in as "Bea"
  And we are offline
  When I run the app
  Then ? I see no "name"

  Given I charge "Abe" 12.34 for "lunch"
#  And I pay "Cit" 56.78 for "groceries"
  When I visit "home"
  Then ? "name" is "Unidentified Member"
  And ? "amt" is "12.34"
  And ? I see "tx-pending"
  And ? "description" is "lunch"
  And ? I see no "extra"
