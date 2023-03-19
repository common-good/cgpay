Feature: Link Account
  As a vendor or individual with more than one account
  I can select the account I wish to link to on my device
  So that I can use multiple CGPay accounts on a single device.

  As a vendor or individual with more than one account
  I can switch my linked account
  So that I can use multiple accounts with CGPay on a single device.

  As a vendor or individual with more than one account
  I can choose to require sign in to switch between linked accounts
  So that my account will not be switched by an unauthorized user.

  As an individual with one account
  My account will be automatically linked to my device upon sign in
  So that I can use CGPay without distracting steps.

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