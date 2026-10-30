Feature: Sign up
  As someone new to Common Good
  I can create an account with my name, email, phone, ZIP, and the Agreement
  So that I can start using the service

Background:
  Given signed in as "nobody"

Rule: A visitor sees the sign-up form

Scenario: A visitor sees the sign-up fields
  When on page "signup"
  Then see "fullName"
  And see "email"
  And see "phone"
  And see "zip"
  And see "agreement"
  And see "btn-signup"

Rule: Validation stops a submit with missing or malformed fields

Scenario: Empty submit shows a field error on every required field
  When on page "signup"
  And click "btn-signup"
  Then error "Please enter your full name."
  And error "Please enter your email address."
  And error "Please enter your phone number."
  And error "Please enter your ZIP code."
  And error "You must agree to the Common Good Agreement to continue."
  And on page "signup"
