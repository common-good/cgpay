Feature: Show QR
  As an individual member
  I can show my QR code
  So another member can charge or pay me.

  Ported from the legacy app's tests/features/show-qr.feature. It runs through the dashboard handoff today, and against the ported screens later.

Rule: An individual sees their QR code on the way to paying or charging

Scenario: An individual shows their QR code to be paid
  Given signed in as "Bea"
  And camera "present"
  When click "btn-receive"
  Then on page "tx-start"
  And see "qr"

Scenario: An individual shows their QR code to pay
  Given signed in as "Bea"
  And camera "present"
  When click "btn-pay"
  Then on page "tx-start"
  And see "qr"

Rule: A company shows no QR code, it goes straight to scanning

Scenario: A company goes to pay
  Given signed in as "Bea"
  And acting as "Cit"
  And camera "present"
  When click "btn-pay"
  Then on page "scan"
  And see not "qr"
