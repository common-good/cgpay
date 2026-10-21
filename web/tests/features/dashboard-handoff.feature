Feature: Dashboard transaction handoff
  As a member using a camera-enabled device
  I can open the existing CGPay scan flow from the dashboard

  Background:
    Given signed in as "nobody"

  Scenario: A camera-enabled device uses the legacy CGPay app
    When I input "Abe One" as "identifier"
    And I input "k" as "password"
    And I click "btn-signin"
    Then on page "dashboard"
    When I set camera availability to "present"
    Then the Pay and Charge actions use the legacy handoff

  Scenario: A device without a camera keeps the PHP transaction links
    When I input "Abe One" as "identifier"
    And I input "k" as "password"
    And I click "btn-signin"
    Then on page "dashboard"
    When I set camera availability to "absent"
    Then the Pay and Charge actions keep their PHP links
