Feature: Welcome
  As someone new to Common Good
  I can choose how I want to join
  So that I reach the right sign-up

Rule: A visitor chooses a role; a member never sees the page

Scenario: A visitor sees the ways to join
  Given signed in as "nobody"
  When on page "welcome"
  Then see "lnk-member"
  And see "lnk-business"
  And see "lnk-sponsee"
  And see "lnk-signin"

Scenario: A member is sent to the dashboard
  Given signed in as "Bea"
  When on page "welcome"
  Then on page ""

Rule: Each role leads to its own sign-up

Scenario: A visitor joins as a member
  Given signed in as "nobody"
  And on page "welcome"
  When click "lnk-member"
  Then on page "signup"
  And see "fullName"

Scenario: A visitor registers a business
  Given signed in as "nobody"
  And on page "welcome"
  When click "lnk-business"
  Then on PHP page "signup-co"

Scenario: A visitor applies for fiscal sponsorship
  Given signed in as "nobody"
  And on page "welcome"
  When click "lnk-sponsee"
  Then on PHP page "co/sponsor"

Scenario: A returning member goes to sign in
  Given signed in as "nobody"
  And on page "welcome"
  When click "lnk-signin"
  Then on page "login"
