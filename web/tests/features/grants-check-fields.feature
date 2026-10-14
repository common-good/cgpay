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
