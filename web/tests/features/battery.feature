Feature: Battery
  As a cashier or member
  I am warned when the phone's battery is low
  So the phone does not die in the middle of the day.

  The phone reports its battery where it can (Android); an iPhone's web view cannot, so no warning shows there.

Rule: Below 20% and not charging, the home screen says to plug in the phone

Scenario: The battery is low
  Given signed in as "Bea"
  And in the store app
  And battery at 15%
  When click "nav-app"
  Then see "battery-warning"

Scenario: The battery is fine
  Given signed in as "Bea"
  And in the store app
  And battery at 80%
  When click "nav-app"
  Then on page "home"
  And see not "battery-warning"
