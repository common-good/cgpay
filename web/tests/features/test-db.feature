Feature: Test database fixture
  As a developer
  I want each scenario to start from the default test accounts
  So that scenarios are independent of each other

  Scenario: The PHP test endpoint is reachable and resets data
    When I read the test transactions
    Then the test transactions are a list
