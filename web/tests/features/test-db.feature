Feature: Test database fixture
  As a developer
  I want each scenario to start from the default test accounts
  So that scenarios are independent of each other

  Scenario: The PHP test endpoint is reachable, resets data and updates users
    Given these "users" rows:
    | uid | fullName |
    | Abe | Abe One  |
    Then these "txs" rows:
    | xid |
