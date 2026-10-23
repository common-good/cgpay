Feature: Dashboard transaction handoff
  As a member using a camera-enabled device
  I can open the existing CGPay scan flow from the dashboard

  Scenario: A camera-enabled device uses the legacy CGPay app
    Given signed in as "Abe"
    When camera "present"
    Then pay and charge go to "legacy app"

  Scenario: A device without a camera keeps the PHP transaction links
    Given signed in as "Abe"
    When camera "absent"
    Then pay and charge go to "PHP"
