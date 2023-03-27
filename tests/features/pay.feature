@all @pay
Feature: Pay
  As an individual
  I can pay another CGPay user for a specified amount 
  So that funds are deducted from my account and added to theirs.

Background:
  * this "myAccount":
  | accountId | deviceId | name    | qr | isCo  | selling | lastTx |
  | K6VMDJJ   | devB     | Bea Two | ?  | false | null    | null   |

Rule: Personal account members have the ability to show a QR code to pay other members

Scenario: I have a personal account linked to my device and can show my QR code to pay vendors
  When I visit "home"
  Then ? I see "qr"