Feature: Pay

Background:
 * context

Rule: Personal account members have the ability to show a QR code to pay other members

Scenario: I have a personal account linked to my device
  When I am on the home screen
  Then ? My Qr Code is visible to pay another member

Scenario: My QR code is scanned to pay
  When Another user scans my QR code and charges me
  Then ? The app deducts the charge amount from my account with the description entered by the other user
