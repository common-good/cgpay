Feature: Feedback
  As a member
  I can open a message form for the administrators from the account menu, on the live site and in the store app
  So my questions and suggestions reach a person.

  The form is the member site's general help page.

Rule: The account menu's Feedback opens the member site's message form

Scenario: A member opens Feedback on the live site
  Given signed in as "Bea"
  When click "btn-acct-menu"
  And click "menu-feedback"
  Then on PHP page "help"

Scenario: A member opens Feedback from the store app's home screen
  Given signed in as "Bea"
  And in the store app
  When click "nav-app"
  Then on page "home"

  When click "btn-acct-menu"
  And click "menu-feedback"
  Then on PHP page "help"

Rule: With no connection the app says Feedback needs one

Scenario: A member opens Feedback offline
  Given signed in as "Bea"
  And in the store app
  When click "nav-app"
  Then on page "home"

  When network off
  And click "btn-acct-menu"
  And click "menu-feedback"
  Then see "offline-msg"
  And on page "home"
