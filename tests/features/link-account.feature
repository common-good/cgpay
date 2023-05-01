@all @b @link
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
# Dee, Hal, and Ida have just one (see the sigin-in feature, because linking is automatic)
  * these choices:
  | Bea   | Bea/Cit |

Rule: Users can link their device to a specific CGPay account

Scenario: A user with multiple accounts visits the link-account page
  When I visit "link-account"
  Then ? I am on page "link-account"
  And ? I see "select-account"
  And ? "account-opt-0" is "Bea Two"
  And ? "account-opt-1" is "Citre"
  And ? "account-opt-1" is "selected"
  And ? "lock-account" is "checked"
  And ? "payOk-radio-always" is not "checked"
  And ? "payOk-radio-scan" is "checked"
  And ? "payOk-radio-never" is not "checked"

Scenario: A user with multiple accounts selects an account with all the defaults
  When I visit "link-account"
  And I click "btn-link"
  Then ? this "payOk": "scan"
  And ? this "choices": "null"
  And ? I am signed in as "Bea/Cit"
  And ? this confirmation: "now linked to your Common Good account: Citre"
  And ? I am on page "home"
  And ? "Citre" is in "account-name"
  When I click "btn-nav"
  Then ? I see "menu-scanIn"
  But ? I do not see "menu-showToPay"
  And ? I do not see "menu-switch"

Scenario: A user with multiple accounts selects different options
  When I visit "link-account"
  And I click "account-opt-0"
  And I click "lock-account"
  And I click "payOk-radio-never"
  And I click "btn-link"
  And I wait 1 seconds
  Then ? this "payOk": "never"
  And ? these choices:
  | Bea | Bea/Cit |
  And ? I am signed in as "Bea"
  And ? I am on page "home"
  And ? "Bea Two" is in "account-name"
  When I click "btn-nav"
  Then ? I do not see "menu-scanIn"
  And ? I do not see "menu-showToPay"
  But ? I see "menu-switch"

Scenario: The user chooses an account offline
  Given I visit "link-account"
  And we are offline
  And I wait 1 seconds
  And ? I see "network-offline"
  When I click "account-opt-0"
  And I click "btn-link"
  Then ? I am on page "home"
  And ? "Bea Two" is in "account-name"

Scenario: The user restarts the app after signing in but before linking
  When I run the app
  Then ? I am on page "link-account"

Scenario: The user restarts the app offline after signing in but before linking
  Given we are offline
  When I run the app
  Then ? I am on page "link-account"

Scenario: The user restarts the app after choosing to switch accounts
  Given I am signed in as "Bea"
  When I run the app
  And I click "btn-nav"
  And I click "menu-switch"
  When I run the app
  Then ? I am on page "link-account"
