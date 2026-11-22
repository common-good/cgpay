Feature: Switching the store app between environments
  As a member or a demonstrator with the store app
  I scan a card that does not belong to the environment the app is in
  So the app switches to demo (test cards), or back to the real environment (real cards), without signing in by hand.

  The app starts at one real environment and can go to demo only. The local server stands in for both: the step "server is demo" makes it act as demo.
  The scenarios run on the store app's bundled screens (see tests/README.md).

Background:
  Given signed in as "Dee"
  And in the store app

Rule: A test card scanned in a real environment asks before switching to demo

Scenario: A test card offers demo, with MFA skipping chosen
  When scan "Abe test card" to "charge"
  Then see "switch-title"
  And checked "skip-mfa"
  And count "app_tokens" is 0

Scenario: Cancelling goes back to the scanner
  When scan "Abe test card" to "charge"
  And click "btn-stay"
  Then see "scan-title"
  And count "app_tokens" is 0

Rule: On demo a test card alone signs the app in as the card's account

Scenario: A test card signs in to demo
  Given server is demo
  When scan "Abe test card" to "charge"
  And click "btn-switch"
  Then on page ""
  And signed in as "Abe"
  And these "app_tokens" rows:
  | uid | label   | trusted |
  | Abe | web app | 0       |

Scenario: A company card signs in the cardholder, acting for the company as its cash register
  Given server is demo
  When scan "Bea/Cit test card" to "charge"
  And click "btn-switch"
  Then on page "scan"
  And these "app_tokens" rows:
  | uid | label   | trusted | lockedTo |
  | Bea | web app | 0       | Cit      |

  When click "btn-back"
  Then text "acct": "Account: Citre"

Scenario: A member with MFA gets no passcode in demo, if skipping is chosen
  Given server is demo
  And MFA on for "Bea"
  When scan "Bea test card" to "charge"
  And click "btn-switch"
  Then on page ""
  And signed in as "Bea"
  And count "app_tokens" is 1

Scenario: A member with MFA gets the passcode if skipping is turned off
  Given server is demo
  And MFA on for "Bea"
  When scan "Bea test card" to "charge"
  And click "skip-mfa"
  And click "btn-switch"
  And passcode emailed
  And input "code": "%passcode"
  And click "btn-confirm"
  Then on page ""
  And signed in as "Bea"
  And count "app_tokens" is 1

Rule: In demo a real card goes back to the real environment, with the cardholder's password

Scenario: A real card switches back
  Given server is demo
  When scan "Abe test card" to "charge"
  And click "btn-switch"
  Then on page ""

  Given server is not demo
  When scan "Bea" to "charge"
  And input "password": "k"
  And click "btn-switch"
  Then on page ""
  And signed in as "Bea"
  And count "app_tokens" is 2

Scenario: A wrong password does not switch back
  Given server is demo
  When scan "Abe test card" to "charge"
  And click "btn-switch"
  Then on page ""

  Given server is not demo
  When scan "Bea" to "charge"
  And input "password": "wrong"
  And click "btn-switch"
  Then error "That password is not right."
  And count "app_tokens" is 1

Rule: A card of the kind that belongs to the environment the app is in is an ordinary scan

Scenario: A test card in demo is a transaction scan
  Given server is demo
  When scan "Abe test card" to "charge"
  And click "btn-switch"
  Then on page ""

  When scan "Dee test card" to "charge"
  Then on page "tx"
  And see "charge-profile"
