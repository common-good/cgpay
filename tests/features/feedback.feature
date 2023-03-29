@all @feedback
Feature: Feedback
  As a vendor or individual
  I can submit feedback and comments about CGPay from the app
  So I know my user experience is valued and I can help improve it.

Background:
 * this "myAccount":
 | accountId | deviceId | name    | qr | isCo  | selling | lastTx |
 | K6VMDJJ   | devB     | Bea Two | ?  | false | null    | null   |

Scenario: I can access a Comments & Suggestions link from the navigation
  When I visit "home"
  When I click "nav-btn"
  Then ? I see "feedback"
@this
Scenario: I can submit feedback and receive a confirmation message that it was received
  When I visit "comment"
  And I input "wow! ❤️" as "comment"
  And we are offline
  And I click "submit-comment"
  Then ? these "comments":
  | created | actorId | text    |
  | %now    | K6VMDJJ | wow! ❤️ |
  And ? I see this confirmation: "Thank you"
