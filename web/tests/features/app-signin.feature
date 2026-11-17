Feature: Store app sign-in
  As a member with the store app on my phone
  I sign in once, on the app's own screen, and stay signed in
  So I do not type my password again, and a lost phone can be cut off.

  The app keeps a token instead of a password or a cookie (the tests use the browser's storage where the phone has its Keychain or Keystore).
  PHP checks the password and the emailed passcode, and keeps only a hash of the token.

Rule: With no account on the phone the app opens on its own sign-in screen, even with no connection

Scenario: The app starts with no account
  When store app has no account
  Then on page "signin"
  And see "btn-signin"
  And see "lnk-signup"
  And see "lnk-reset"
  And see not "btn-pay"
  And count "app_tokens" is 0

Scenario: The sign-in screen shows with no connection, and says so when asked to sign in
  Given network off
  When store app has no account
  And input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  Then error "No connection. Connect to the internet to sign in."
  And on page "signin"

Rule: The right password signs the app in and gives it its account

Scenario: A member signs in
  Given store app has no account
  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  Then on page "home"
  And text "acct": "Account: Bea Two"
  And see "btn-pay"
  And count "app_tokens" is 1
  And these "app_tokens" rows:
  | uid | label   | trusted | revoked |
  | Bea | web app | 0       |         |

Scenario: A wrong password gets nothing
  Given store app has no account
  When input:
  | identifier | password |
  | Bea Two    | wrong    |
  And click "btn-signin"
  Then error "Invalid account ID or password."
  And on page "signin"
  And count "app_tokens" is 0

Scenario: The app stays signed in when it is opened again
  Given store app has no account
  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  Then on page "home"

  When reload
  Then on page "home"
  And text "acct": "Account: Bea Two"
  And count "app_tokens" is 1

Rule: A member with multi-factor authentication also gives the passcode PHP emails

Scenario: The member gives the emailed passcode
  Given MFA on for "Bea"
  And store app has no account
  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  Then see "code"
  And count "app_tokens" is 0

  When passcode emailed
  And input "code": "%passcode"
  And click "btn-confirm"
  Then on page "home"
  And text "acct": "Account: Bea Two"
  And count "app_tokens" is 1

Scenario: A wrong passcode is refused
  Given MFA on for "Bea"
  And store app has no account
  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  And input "code": "00000000"
  And click "btn-confirm"
  Then error "That code is not right."
  And count "app_tokens" is 0

Scenario: A trusted device skips the passcode the next time
  Given MFA on for "Bea"
  And store app has no account
  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  And passcode emailed
  And input "code": "%passcode"
  And click "trust"
  And click "btn-confirm"
  Then on page "home"

  When click "btn-signout"
  Then on page "signin"

  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  Then on page "home"
  And count "app_tokens" is 2

Rule: Signing out ends the token and forgets the account on the phone

Scenario: A member signs out
  Given store app has no account
  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  Then on page "home"

  When click "btn-signout"
  Then on page "signin"
  And these "app_tokens" rows:
  | uid | revoked |
  | Bea | !       |

  When reload
  Then on page "signin"

Scenario: Signing out of the app also signs out of the live site
  Given store app has no account
  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  And click "btn-dashboard"
  Then on page ""
  And signed in as "Bea"

  When store app opens
  And click "btn-signout"
  Then on page "signin"

  When on page ""
  Then signed in as "nobody"

Rule: A member with transactions still waiting to send is warned before signing out, and can cancel

Scenario: A member cancels signing out
  Given signed in as "Bea"
  And acting as "Cit"
  And in the store app
  And camera shows "Dee"
  When click "nav-app"
  Then text "acct": "Account: Citre"

  When network off
  And scan "Dee" to "charge"
  And click "btn1"
  And input:
  | input-amount | input-description |
  | 234.50       | food!             |
  And click "btn-submit"
  And click "btn-done"
  And click "btn-signout"
  Then see "signout-warning"
  And see "queued"

  When click "btn-cancel-signout"
  Then see not "signout-warning"
  And on page "home"
  And see "queued"

Scenario: A member signs out anyway and the waiting transactions are dropped
  Given signed in as "Bea"
  And acting as "Cit"
  And in the store app
  And camera shows "Dee"
  When click "nav-app"
  Then text "acct": "Account: Citre"

  When network off
  And scan "Dee" to "charge"
  And click "btn1"
  And input:
  | input-amount | input-description |
  | 234.50       | food!             |
  And click "btn-submit"
  And click "btn-done"
  And click "btn-signout"
  And click "btn-signout-anyway"
  Then on page "signin"

  When network on
  And reload
  Then on page "signin"
  And count "txs" is 0

Rule: The live dashboard opens signed in from the token, with no sign-in on the live site

Scenario: The dashboard button opens the live site as the member
  Given store app has no account
  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  Then on page "home"

  When click "btn-dashboard"
  Then on page ""
  And signed in as "Bea"
