@all @a @comment
Feature: Comment
  As a vendor or individual
  I can submit feedback and comments about CGPay from the app
  So I know my user experience is valued and I can help improve it.

Background:
  * I am signed in as "Bea"

Scenario: I can access a Comments & Suggestions link from the navigation
  When I visit "home"
  And I click "btn-nav"
  Then ? I see "menu-comment"

Scenario: I can submit feedback and receive a confirmation message that it was received
  When I visit "comment"
  And I input "wow! ❤️" as "comment"
  And I click "submit-comment"
  Then ? these "comments":
  | actorId | created | deviceId | text    |
  | Bea     | now     | devB     | wow! ❤️ |
  And ? I see this confirmation: "Thank you"

Scenario: I can submit feedback offline
  Given we are offline
  When I visit "home"
  And I click "btn-nav"
  Then ? I see "menu-comment"
  When I click "menu-comment"
  Then ? I am on page "comment"
  When I input "wow! ❤️" as "comment"
  And I click "submit-comment"
  Then ? these "comments":
  | actorId | created | deviceId | text    |
  | Bea     | now     | devB     | wow! ❤️ |
  And ? I see this confirmation: "Thank you"
