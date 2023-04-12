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

Rule: Users must link their device to a CGPay account to use the app

Scenario: The user chooses from among multiple accounts with default account lock
  When I visit "link-account"
  Then ? I am on page "link-account"
  And ? I see "select-account"
  And ? I see "option-0" is "Bea Two"
  When I click "option-0"
  And I click "btn-link"
  And I wait 1 seconds
  Then ? I am on page "home"
  And ? I see "Bea Two" in "account-name"
  And ? I see this confirmation: "now linked to your Common Good account: Bea Two"
  And ? I am signed in as "Bea"
  And ? this "choices": "null" 
  When I click "btn-nav"
  Then ? I do not see "menu-switch"

Scenario: The user chooses a different account without account lock
  When I visit "link-account"
  And I click "option-1"
  And I click "lock-account"
  And I click "btn-link"
  And I wait 1 seconds
  Then ? I see "Citre" in "account-name"
  When I click "btn-nav"
  And ? I see "menu-switch"

Scenario: The user chooses an account offline
  Given I visit "link-account"
  And we are offline
  And I wait 1 seconds
  And ? I see "network-offline"
  When I click "option-0"
  And I click "btn-link"
  Then ? I am on page "home"
  And ? I see "Bea Two" in "account-name"
