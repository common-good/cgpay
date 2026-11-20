Feature: Go back
  As a member
  I can click the back button to return to a previous screen when possible
  So I can correct an omission or error

  Ported from the legacy app's tests/features/back.feature, for the bundled screens. The legacy scenarios about sign-in, link-account, comments and the menu are not ported (the live site has none of those screens in the app).

Rule: No back button on the app's home screen

Scenario: The app's home screen
  Given signed in as "Bea"
  And in the store app
  When click "nav-app"
  Then see not "btn-back"

Rule: On the summary, back means undo

Scenario: A member completes a transaction and goes back
  Given signed in as "Bea"
  And acting as "Cit"
  And in the store app
  When scan "Dee" to "charge"
  And input:
  | input-amount | input-description |
  | 12.34        | lunch             |
  And click "btn-submit"
  And click "btn-back"
  Then text "messageText": "Reverse the transaction?"

Rule: Everywhere else, back goes to the screen before

Scenario: An individual goes back from the scanner to the start page, then to the home screen
  Given signed in as "Bea"
  And in the store app
  And camera shows "nobody"
  When click "nav-app"
  And click "btn-receive"
  And click "btn-scan"
  Then on page "scan"

  When click "btn-back"
  Then on page "tx-start"

  When click "btn-back"
  Then on page "home"
  And see not "btn-back"

Scenario: A company, which skips the start page, goes back from the scanner to the home screen
  Given signed in as "Bea"
  And acting as "Cit"
  And in the store app
  And camera shows "nobody"
  When click "nav-app"
  And click "btn-receive"
  And click "btn-back"
  Then on page "home"

Scenario: A member goes back from the transaction screen to the scanner, with the card still in view
  Given signed in as "Bea"
  And acting as "Cit"
  And in the store app
  When scan "Dee" to "charge"
  And click "btn-back"
  And wait 3 seconds
  Then on page "scan"
