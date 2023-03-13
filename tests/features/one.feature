@visits
Feature: Googling

Background:
  * context

Rule: Sites have titles

Scenario: I look at Google
  When I visit "google.com"
  Then ? the page title is "Google"

# Then statements always begin with a question mark

Scenario: I look at Google again
  When I visit "google.com"
  Then ? the page title is "Moogle"
