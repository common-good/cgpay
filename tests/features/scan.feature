@all @scan
Feature: Scan QR Code
  As an individual member or member company
  I can scan another member's QR Code (individual or company) from their app or card
  So I can validate their account and charge them (or in a future release pay them) for goods or services.

Implicit Background: see features/background.txt

Background:
 * this "myAccount":
 | accountId | deviceId | name    | qr | isCo  | selling | lastTx |
 | K6VMDJJ   | devB     | Bea Two | ?  | false | null    | null   |

Rule: Personal accounts can scan an individual or company card

Scenario: I scan an individual's QR
  When I scan "HTTP://6VM.RC4.ME/KDJI12345a"
  Then ? I am on page "charge"
  And ? I am on page "charge-profile"
  And ? I see "theirPhoto"
  And ? I see "theirName" is "Abe One"
  And ? I see "theirLocation" is "Aton, MA"

Scenario: I scan a company agent's QR
  When I scan "HTTP://6VM.RC4.ME/LDJK098765a"
  Then ? I am on page "charge"
  And ? I am on page "charge-profile"
  And ? I see "theirPhoto"
  And ? I see "theirAgent" is "Abe One"
  And ? I see "theirCompany" is "Citre"
  And ? I see "theirLocation" is "Cton, MA"

Rule: Company accounts can scan an individual or company card

Scenario: A company scans an individual's QR
  Given this "myAccount":
 | accountId | deviceId | name    | qr | isCo  | selling                  | lastTx |
 | L6VMDJK0  | devC     | Citre   | ?  | true  | groceries/gifts/sundries | %today |
  When I scan "HTTP://6VM.RC4.ME/KDJI12345a"
  Then ? I am on page "charge"
  And ? I am on page "charge-profile"
  And ? I see "theirPhoto"
  And ? I see "theirName" is "Abe One"
  And ? I see "theirLocation" is "Aton, MA"

Rule: Scanning an invalid card produces an error message

Scenario: I scan my own card
  When I scan "HTTP://6VM.RC4.ME/KDJJ12345b"
  Then ? I am on page "home" 
  And ? I see this message: "same account as yours"

Scenario: I scan an invalid or stolen card
  When I scan "HTTP://6VM.RC4.ME/KDJI12345x"
  Then ? I am on page "home" 
  Then ? I see this message: "not a valid Common Good card"

Scenario: I scan a QR for something else
  When I scan "whatever"
  Then ? I am on page "home" 
  Then ? I see this message: "not a valid Common Good card format"
