@all @scan
Feature: Scan QR Code
  As an individual member or member company
  I can scan another member's QR Code (individual or company) from their app or card
  So I can validate their account and charge them (or in a future release pay them) for goods or services.

Implicit Background: see features/background.txt

Background:
 * this "myAccount":
 | accountId | deviceId | name | qr | isCo | selling | lastTx |

Rule: Personal and Business accounts can scan another user's QR code to charge them.

Scenario: I scan another user's QR code
  When I scan a QR code
  Then ? The app looks up and finds the corresponding user

Scenario: I scan an invalid QR code
  When I scan an invalid QR code
  Then ? The app shows an error message
