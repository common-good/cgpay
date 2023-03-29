@all @link
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
# Abe, Bea, and Flo have two accounts
# Dee, Hal, and Ida have just one

Rule: Users must link their device to a CGPay account to use the app

Scenario: I have multiple accounts
  Given these "choices":
  | accountId | deviceId | name    | qr | isCo  | selling | lastTx |
  | K6VMDJJ   | devB     | Bea Two | ?  | false | null    | null   |
  | K6VMDJK   | devC     | Citre   | ?  | false | food    | null   |
  Then ? these "choices":
  | accountId | deviceId | name    | qr | isCo  | selling | lastTx |
  | K6VMDJJ   | devB     | Bea Two | ?  | false | null    | null   |
  | K6VMDJK   | devC     | Citre   | ?  | false | food    | null   |
  When I visit "link-account"
  Then ? I am on page "link-account"
  And ? I see "select-account"
  And ? I see "option-0" is "Bea Two"
  When I click "option-0"
  And I click "btn-link"
  Then ? I am on page "home"
  And ? I see "account-name" is "Dee Four"
  And ? this "myAccount":
  | accountId | deviceId | name    | qr | isCo  | selling | lastTx |
  | K6VMDJJ   | devB     | Bea Two | ?  | false | null    | null   |

# Scenario: I have multiple accounts
#   When I link an account to my device
#   Then ? I can choose to require sign-in to change my linked account

# Scenario: I have multiple accounts
#   When I choose to require sign-in to change my linked account
#   Then ? The navigation will not show a Switch Account menu option

# Scenario: I have only one account (see the signin feature)
