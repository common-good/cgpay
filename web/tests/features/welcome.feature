Feature: Welcome
  As someone new to Common Good
  I can choose how I want to join
  So that I reach the right sign-up

Rule: A visitor chooses a role; a member never sees the page

Scenario: A visitor sees the ways to join
  Given signed in as "nobody"
  When on page "welcome"
  Then see "cta-member"
  And see "cta-business"
  And see "cta-sponsee"
  And see "link-signin"

Scenario: A member is sent to the dashboard
  Given signed in as "Bea"
  When on page "welcome"
  Then on page ""

Rule: Each role leads to its own sign-up

Scenario: A visitor joins as a member
  Given signed in as "nobody"
  And on page "welcome"
  When click "cta-member"
  Then on page "signup"
  And see "fullName"

Scenario: A visitor registers a business
  Given signed in as "nobody"
  And on page "welcome"
  When click "cta-business"
  Then on PHP page "signup-co"

Scenario: A visitor applies for fiscal sponsorship
  Given signed in as "nobody"
  And on page "welcome"
  When click "cta-sponsee"
  Then on PHP page "co/sponsor"

Scenario: A returning member goes to sign in
  Given signed in as "nobody"
  And on page "welcome"
  When click "link-signin"
  Then on page "login"
