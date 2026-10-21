Feature: Grant check details
  As a sponsored company
  I report an expected grant without check details I do not have yet
  So that I can submit before the check arrives

Rule: Check number and date are admin-only

Scenario: A sponsee reports a check grant without check details
  Given I sign in as "Flo"
  And I act as "Gis"
  When I go to page "new grant"
  And I select "Check" as "by"
  Then I do not see "ckNum"
  And I do not see "ckDate"

Scenario: An admin enters check details
  Given I sign in as "Abe"
  When I go to page "new grant"
  And I select "Check" as "by"
  Then I see "ckNum"
  And I see "ckDate"

Scenario: A sponsee reports a check grant and submits it without check details
  Given I sign in as "Flo"
  And I act as "Gis"
  When I go to page "new grant"
  And I input "Gina Grantor" as "grantor"
  And I input "1000" as "amount"
  And I select "Check" as "by"
  And I input "1 Main St" as "address"
  And I input "Boston" as "city"
  And I select "MA" as "state"
  And I input "02108" as "zip"
  And I click "btn-report"
  Then on page "grants"
  And I see text "Gina Grantor"
