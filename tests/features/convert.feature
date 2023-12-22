@all @b @convert
Feature: Convert
  As an app user
  I can count on my data being converted automatically when a new version is released
  So I can continue to use the app without interruption.

Background:

Rule: Upgrading from release A works

Scenario: A user of release A runs this new version
  Given data from release "A"
  When I run the app
  Then ? I am on page "home"


Scenario: A user of release B runs this new version
  Given data from release "B"
  When I run the app
  Then ? I am on page "home"

Scenario: A user of release C runs this new version
  Given data from release "C"
  When I run the app
  Then ? I am on page "home"

Scenario: A user with corrupt data runs this new version
  Given data from release "C"
  And this "corrupt": "12345"
  And these "txs":
  | deviceId | amount | actorId | otherId | description | created | proof | offline | version |
  | devC     | 234.50 | Abe/Cit | Bea     | food!       | now     | hash  | true    | 40200   |
  When I run the app
  Then ? I am on page "home"
#  And we report account "Bea" had corrupt txs:
#  | deviceId | amount | actorId | otherId | description | created | proof | offline | version |
#  | devC     | 234.50 | Abe/Cit | Bea     | food!       | now     | hash  | true    | 40200   |
  When we wait for uploads
  Then ? count "txs" is 0
