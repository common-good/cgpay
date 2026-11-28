Feature: Feedback
  As a member
  I can send Common Good a message from the account menu, on the live site and in the store app
  So my ideas, praise and problems reach a person.

  The message goes to the member's community administrator, as from the member site's help form. From the store app, the app's recent log goes too, to the tech team.

Rule: The live site's Feedback is a form of its own

Scenario: A member sends feedback on the live site
  Given signed in as "Bea"
  When click "btn-acct-menu"
  And click "menu-feedback"
  Then see "feedback-form"

  When input "input-message": "Nice work!"
  And click "btn-send"
  Then see "feedback-sent"

Rule: The store app's Feedback is a screen of its own, which also sends the app's log

Scenario: A member sends feedback from the store app
  Given signed in as "Bea"
  And in the store app
  When click "nav-app"
  Then on page "home"

  When click "btn-acct-menu"
  And click "menu-feedback"
  Then on page "feedback"

  When input "input-message": "Nice work!"
  And click "btn-send"
  Then see "feedback-sent"

Rule: With no connection the app says sending needs one

Scenario: A member sends feedback offline
  Given signed in as "Bea"
  And in the store app
  When click "nav-app"
  Then on page "home"

  When network off
  And click "btn-acct-menu"
  And click "menu-feedback"
  And input "input-message": "Nice work!"
  And click "btn-send"
  Then see "feedback-error"
  And on page "feedback"
