@all @a @showqr
Feature: Show QR
  As an individual or vendor
  I can pay or be paid by another member by displaying my QR code
  So they can charge or pay me.

Background:

Rule: Personal account members have the ability to show a QR code to pay or charge
@this
Scenario: An individual shows their QR code to be paid
  Given I am signed in as "Bea"
  When I run the app
  And I click "btn-charge"
  * snap
  Then ? I see "qr"

Scenario: An individual shows their QR code to pay
  Given I am signed in as "Bea"
  When I run the app
  And I click "btn-pay"
  Then ? I see "qr"

Scenario: A user shows their QR code to pay offline
  Given I am signed in as "Bea"
  And we are offline
  When I run the app
  And I click "btn-pay"
  Then ? I see "qr"

Rule: Company accounts do not show a QR

Scenario: A vendor shows their QR code
  Given I am signed in as "Abe/Cit"
  When I run the app
  Then ? I see no "qr"
