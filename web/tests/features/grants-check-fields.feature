Feature: Grant check details
  As a sponsored company
  I report an expected grant without check details I do not have yet
  So that I can submit before the check arrives

Rule: Check number and date are admin-only

Scenario: A sponsee reports a check grant without check details
  Given signed in as "Flo"
  And acting as "Gis"
  And on page "/grants/new"
  When select "by": "Check"
  Then see not "ckNum"
  And see not "ckDate"

Scenario: An admin enters check details
  Given signed in as "Abe"
  And on page "/grants/new"
  When select "by": "Check"
  Then see "ckNum"
  And see "ckDate"

Scenario: A sponsee reports a check grant and submits it without check details
  Given signed in as "Flo"
  And acting as "Gis"
  And on page "/grants/new"
  When input:
  | grantor      | amount | by    | address   | city   | state | zip   |
  | Gina Grantor | 1000   | Check | 1 Main St | Boston | MA    | 02108 |
  And click "btn-report"
  Then on page "/grants"
  And see "Gina Grantor"
