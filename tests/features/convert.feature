@all @b @convert
Feature: Convert
  As an app user
  I can count on my data being converted automatically when a new version is released
  So I can continue to use the app without interruption.

Background:

Rule: Upgrading from release A works

Scenario: A user of release A runs this new version
  Given data from release "A"
  When I run the app
  Then ? I am on page "home"
