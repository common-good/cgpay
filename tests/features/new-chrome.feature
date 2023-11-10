@all @c @chrome
Feature: Problems arising from the new chrome headless browser (mid 2023)
  As a developer
  I can run our feature tests successfully with the new headless browser
  So I don't have to fly without a net.

Implicit Background: see features/background.txt

Scenario: Several putv calls in a row
* I am signed in as "Abe/Cit"
* I visit "home"
* this "qr": "bar"

Scenario: Set offline
  Given we are offline
  And I wait 1 seconds
  Then ? this "useWifi": "false"
  And ? this "online": "false"

  When I run the app
  Then ? this "useWifi": "false"
  And ? this "online": "false"
