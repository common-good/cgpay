Feature: Phone clock
  As a member or cashier
  I am told when my phone's clock is far off, and my transactions are recorded at the right time anyway
  So that offline transactions are not dated wrong.

  The app compares the phone's clock with the server's when it starts, and keeps the difference for starts without a signal.

Rule: A phone clock off by more than 5 minutes is reported on the home screen

Scenario: A phone whose clock is 2 hours slow
  Given signed in as "Bea"
  And in the store app
  And phone clock is 2 hours slow
  When click "nav-app"
  Then see "clock-notice"

Scenario: A phone whose clock is right
  Given signed in as "Bea"
  And in the store app
  When click "nav-app"
  Then on page "home"
  And see not "clock-notice"
