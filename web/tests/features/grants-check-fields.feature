Feature: Grant check details
  As a sponsored company
  I report an expected grant without check details I do not have yet
  So that I can submit before the check arrives

Rule: Check number and date are admin-only

Scenario: A sponsee reports a check grant without check details
  Given signed in as "Flo"
  And act as "Gis"
  When on page "new grant"
  And select "by": "Check"
  Then see not "ckNum"
  And see not "ckDate"

Scenario: An admin enters check details
  Given signed in as "Abe"
  When on page "new grant"
  And select "by": "Check"
  Then see "ckNum"
  And see "ckDate"

Scenario: A sponsee reports a check grant and submits it without check details
  Given signed in as "Flo"
  And act as "Gis"
  When on page "new grant"
  And input "grantor": "Gina Grantor"
  And input "amount": "1000"
  And select "by": "Check"
  And input "address": "1 Main St"
  And input "city": "Boston"
  And select "state": "MA"
  And input "zip": "02108"
  And click "btn-report"
  Then on page "grants"
  And see "Gina Grantor"
