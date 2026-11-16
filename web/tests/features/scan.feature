Feature: Scan QR Code
  As an individual member or member company
  I can scan another member's QR code (individual or company) from their app or card
  So I can check their account and charge or pay them for goods or services.

  Ported from the legacy app's tests/features/scan.feature. It runs through the dashboard handoff today, and against the ported screens later.

Rule: An individual can scan an individual's or a company agent's card

Scenario: A member scans an individual's QR
  Given signed in as "Bea"
  When scan "Abe" to "charge"
  Then on page "tx"
  And see "charge-profile"
  And see "theirPhoto"
  And text "theirName": "Abe One"
  And text "theirLocation": "Aton, MA"

Scenario: A member scans a company agent's QR
  Given signed in as "Bea"
  When scan "Abe/Cit" to "charge"
  Then on page "tx"
  And see "charge-profile"
  And see "theirPhoto"
  And text "theirAgent": "Abe One"
  And text "theirCompany": "Citre"
  And text "theirLocation": "Cton, MA"

Rule: A company can scan an individual's card

Scenario: A company scans an individual's QR
  Given signed in as "Bea"
  And acting as "Cit"
  When scan "Abe" to "charge"
  Then on page "tx"
  And see "theirPhoto"
  And text "theirName": "Abe One"
  And text "theirLocation": "Aton, MA"

Rule: Scanning an unusable card returns to the dashboard with an error

Scenario: A member scans their own card to charge
  Given signed in as "Bea"
  When scan "Bea" to "charge"
  Then on page ""
  And see "notice-error"
  And text "msg": "That QR is for the same account as yours."

Scenario: A member scans an invalid or stolen card
  Given signed in as "Bea"
  When scan "Invalid" to "charge"
  Then on page ""
  And text "msg": "That is not a valid Common Good member QR Code."

Scenario: A member scans a QR that is not for Common Good
  Given signed in as "Bea"
  When scan "Other" to "charge"
  Then on page ""
  And text "msg": "That is not a valid Common Good QR Code format."
