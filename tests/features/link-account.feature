Feature: Link Account

Background:
 * context

Rule: Users must link their device to a CGPay account to use the app

Scenario: I have multiple accounts
  When I have multiple accounts
  Then ? The app shows a list of my accounts to link

Scenario: I have multiple accounts
  When I link an account to my device
  Then ? I can choose to require sign-in to change my linked account

Scenario: I have multiple accounts
  When I choose to require sign-in to change my linked account
  Then ? The navigation will not show a Switch Account menu option

Scenario: I have only one account
  When I have only one account
  Then ? The app automatically links my account to the device I am using