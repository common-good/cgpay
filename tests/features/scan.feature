@all @scan
Feature: Scan QR Code
  As an individual member or member company
  I can scan another member's QR Code (individual or company) from their app or card
  So I can validate their account and charge them (or in a future release pay them) for goods or services.

Implicit Background: see features/background.txt

Background:
 * I am signed in as "Bea"

Rule: Personal accounts can scan an individual or company card

Scenario: I scan an individual's QR
  When I scan "Abe"
  Then ? I am on page "charge"
  And ? I am on page "charge-profile"
  And ? I see "theirPhoto"
  And ? I see "theirName" is "Abe One"
  And ? I see "theirLocation" is "Aton, MA"

Scenario: I scan a company agent's QR
  When I scan "Abe/Citre"
  Then ? I am on page "charge"
  And ? I am on page "charge-profile"
  And ? I see "theirPhoto"
  And ? I see "theirAgent" is "Abe One"
  And ? I see "theirCompany" is "Citre"
  And ? I see "theirLocation" is "Cton, MA"

Rule: Company accounts can scan an individual or company card
@scan1
Scenario: A company scans an individual's QR
  Given I am signed in as "Bea/Citre"
  When I scan "Abe"
  Then ? I am on page "charge"
  And ? I am on page "charge-profile"
  And ? I see "theirPhoto"
  And ? I see "theirName" is "Abe One"
  And ? I see "theirLocation" is "Aton, MA"
  And ? these accounts:
  | Abe |

Rule: Scanning an invalid card produces an error message
@scan2
Scenario: I scan my own card
  When I scan "Bea"
  Then ? I am on page "home" 
  And ? I see this error: "same account as yours"
@scan3
Scenario: I scan an invalid or stolen card
  When I scan "Invalid"
  Then ? I am on page "home" 
  Then ? I see this error: "not a valid Common Good card"
@scan4
Scenario: I scan a QR for something else
  When I scan "Other"
  Then ? I am on page "home" 
  Then ? I see this error: "not a valid Common Good card format"
