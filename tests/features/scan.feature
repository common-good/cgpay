@scan
Feature: Scan QR Code
  As a vendor or individual
  I can scan another user's QR Code from their app or card
  So that I can validate their account and charge them for goods or services.

Background:
 * context

Rule: Personal and Business accounts can scan another user's QR code to charge them.

Scenario: I scan another user's QR code
  When I scan a QR code
  Then ? The app looks up and finds the corresponding user

Scenario: I scan an invalid QR code
  When I scan an invalid QR code
  Then ? The app shows an error message