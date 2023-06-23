@all @b @scan
Feature: Scan QR Code
  As an individual member or member company
  I can scan another member's QR Code (individual or company) from their app or card
  So I can validate their account and charge or pay them for goods or services.

Implicit Background: see features/background.txt

Background:
 * I am signed in as "Bea"

Rule: Scanning requires an intent

Scenario: We scan with intent to charge
  Given this "intent": "charge"
  When I visit "scan"
  Then ? I am on page "scan"

Scenario: We scan with intent to pay
  Given this "intent": "pay"
  When I visit "scan"
  Then ? I am on page "scan"

Scenario: We scan with intent to scanIn
  Given this "intent": "scanIn"
  When I visit "scan"
  Then ? I am on page "scan"

Rule: Personal accounts can scan an individual or company card

Scenario: I scan an individual's QR
  When I scan "Abe" to "charge"
  Then ? I am on page "tx"
  And ? I am on page "charge-profile"
  And ? I see "theirPhoto"
  And ? "theirName" is "Abe One"
  And ? "theirLocation" is "Aton, MA"

Scenario: I scan a company agent's QR
  When I scan "Abe/Cit" to "charge"
  Then ? I am on page "tx"
  And ? I am on page "charge-profile"
  And ? I see "theirPhoto"
  And ? "theirAgent" is "Abe One"
  And ? "theirCompany" is "Citre"
  And ? "theirLocation" is "Cton, MA"

Rule: Company accounts can scan an individual or company card

Scenario: A company scans an individual's QR
  Given I am signed in as "Bea/Cit"
  When I scan "Abe" to "charge"
  Then ? I am on page "tx"
  And ? I am on page "charge-profile"
  And ? I see "theirPhoto"
  And ? "theirName" is "Abe One"
  And ? "theirLocation" is "Aton, MA"
  And ? these accounts:
  | Abe |

Rule: Scanning an invalid card produces an error message

Scenario: I scan my own card to charge
  When I scan "Bea" to "charge"
  Then ? I am on page "home" 
  And ? this error: "same account as yours"

Scenario: I scan my own card to pay
  When I scan "Bea" to "pay"
  Then ? I am on page "home" 
  And ? this error: "same account as yours"

Scenario: I scan a non-employee card to scan in
  Given I am signed in as "Bea/Cit"
  Then ? this "coPaying": "false"
  When I scan "Dee" to "scanIn"
  Then ? I am on page "home" 
  And ? this error: "That is not a QR for this company."

Scenario: I scan an invalid or stolen card
  When I scan "Invalid" to "charge"
  Then ? I am on page "home" 
  Then ? this error: "That is not a valid Common Good member QR Code."

Scenario: I scan a QR that is not for Common Good
  When I scan "Other" to "charge"
  Then ? I am on page "home" 
  Then ? this error: "not a valid Common Good QR Code format"

Rule: Scanning to charge or pay works fine offline

Scenario: I scan an individual's QR offline
  Given we are offline
  When I scan "Abe" to "charge"
  Then ? I am on page "tx"
  And ? I am on page "charge-profile"
  And ? "theirName" is not "Abe One"
  And ? I see "network-offline"
  And ? "Trust this member or ask for ID" is in "messageText"

Scenario: I scan an individual's QR online, then again offline
  Given I run the app
  And these accounts:
  | Abe |
  And we are offline
  And I scan "Abe" to "charge"
  Then ? "Trust this member or ask for ID" is in "messageText"
  When I click "btn1"
  And I wait 1 seconds
  Then ? "theirName" is "Abe One"
  And ? "theirLocation" is "Aton, MA"

Rule: A manager can scan in to pay

#Scenario: I scan my employee card to scan in
#  Given I am signed in as "Bea/Cit"
#  Then ? this "coPaying": "false"
#  When I scan "Bea/Cit" to "scanIn"
#  Then ? I am on page "home" 
#  And ? this "coPaying": "true"
#  And ? I see "btn-pay"
#  And ? I see "qr"
#  And ? "Show this code to BE PAID" is in "header"

Scenario: I scan another employee card to scan in
  Given I am signed in as "Bea/Cit"
  When I scan "Abe/Cit" to "scanIn"
  Then ? this "coPaying": "true"

Scenario: I scan my personal card to scan in online
  Given I am signed in as "Bea/Cit"
  And we are online
  When I scan "Bea" to "scanIn"
  Then ? this "coPaying": "true"

# Scenario: I scan another employee's personal card to scan in online
#   Given I am signed in as "Bea/Cit"
#   And we are online
#   When I scan "Abe" to "scanIn"
#   Then ? this "coPaying": "true"

Rule: A manager can scan in offline to pay if it's their device

Scenario: I scan my employee card offline to scan in
  Given I am signed in as "Bea/Cit"
  And we are offline
  When I scan "Bea/Cit" to "scanIn"
  Then ? this "coPaying": "true"

Scenario: I scan another employee card offline to scan in
  Given I am signed in as "Bea/Cit"
  And we are offline
  When I scan "Abe/Cit" to "scanIn"
  Then ? this "coPaying": "true"

Scenario: I scan my personal card to scan in offline
  Given I am signed in as "Bea/Cit"
  And we are offline
  When I scan "Bea" to "scanIn"
  Then ? this "coPaying": "true"

#Scenario: I scan my personal card to scan in offline
#  Given I am signed in as "Bea/Cit"
#  And we are offline
#  When I scan "Bea" to "scanIn"
#  Then ? this "coPaying": "false"

#Scenario: I scan my personal card to scan in offline on someone else's device
#  Given I am signed in as "Bea/Cit"
#  And we are offline
#  When I scan "Abe" to "scanIn"
#  Then ? this "coPaying": "false"
