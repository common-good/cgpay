Feature: Add To Home Screen

Background:
  * context
  * Apple i0S
  * Android

Rule: Users are prompted to add the app to their home screen with device-specific instructions

Scenario: I visit CGPay online
  When I have not been prompted to add the app to my home screen
  Then ? I am prompted to install the app to my home screen

Scenario: I visit CGPay online
  When I have previously been prompted to add the app to my home screen
  Then ? I am directed to the sign-in page

Scenario: I am on an iOS device
  When I visit the CGPay app online
  Then ? I am prompted to install the app to my home screen

Scenario: I am on an Android device
  When I visit the CGPay app online
  Then ? I am prompted to install the app to my home screen
