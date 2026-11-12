Feature: Stale session cookie
  As a member
  I can sign in even when my browser still holds a session cookie from an older sign-in
  So that a change in how the cookie is scoped never leaves me looking signed out

Background:
  Given signed in as "nobody"

Rule: A stale session cookie does not hide the one from a good sign-in

Scenario: A member signs in while the browser holds a stale session cookie
  Given stale session cookie
  When input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  Then on page ""
  And signed in as "Bea"
  And see "balance"
