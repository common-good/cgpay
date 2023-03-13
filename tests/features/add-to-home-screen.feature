Feature: Add To Home Screen

Background:
  * mobile device
   * Apple i0S
   * Android

Rule: Mobile device users are prompted to add the app to their home screen

Scenario: I visit the CGPay app online
  When I visit the CGPay app online
  Then ? I am prompted to install the bookmark to my home screen

Scenario: I am on an iOS device
  When I visit the CGPay app online
  Then ? I am prompted to install the bookmark to my home screen

Scenario: I am on an Android device
  When I visit the CGPay app online
  Then ? I am prompted to install the bookmark to my home screen
