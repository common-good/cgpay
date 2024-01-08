@all @c @bugs
Feature: Problems arising from the new chrome headless browser (mid 2023) and other bugs
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

Scenario: A company charges an individual then undoes the transaction
  * I am signed in as "Abe/Cit"
  When I charge "Bea" 1234.50 for "food!"
  When I click "btn-undo"
  When I click "btn2"
  Then ? I am on page "tx-details"
  And ? this "pending": "true"
  When I click "btn-back"
  When I click "btn2"
  Then ? I am on page "tx-details"
  When I click "btn-undo"
  Then ? this alert: "Reverse the transaction?"
  And ? "btn1" is "Yes"
  When I click "btn1"
  Then ? this confirmation: "The transaction has been reversed."
  And ? I am on page "home"
