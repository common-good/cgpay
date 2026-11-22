Feature: A company account as a cash register
  As a manager of a company
  I leave the store app on the company's account for a cashier
  So the cashier can charge customers but reach nothing else, until a manager signs in.

  Bea manages Citre. A company account opens to Charge, locked: the home screen offers Scan to Charge and the company's QR to receive.
  Pay / Refund and the account picture ask for a manager (Manager Sign-in). A manager's sign-in puts the device in Manager Mode for 2 minutes of use.
  The server enforces the lock too: the token works for the company alone (see cgmembers-frame api/features/app-register.feature).
  The scenarios run on the store app's bundled screens.

Background:
  Given store app has no account
  And input:
  | identifier | password |
  | Bea Two    | k        |
  And click "btn-signin"
  And click "btn-acct-menu"
  And click "menu-accounts"
  And select "account": "Citre"

Rule: A manager's company account opens to Charge, locked

Scenario: Choosing the company opens the scanner, locked
  When click "btn-use"
  Then on page "scan"
  And these "app_tokens" rows:
  | uid | lockedTo |
  | Bea | Cit      |

Scenario: The locked home screen offers charging and receiving, and asks for a manager for the rest
  Given click "btn-use"
  When click "btn-back"
  Then on page "home"
  And see "btn-scan"
  And see "qr"
  And see "btn-pay"
  And see "btn-acct-menu"
  And see not "btn-dashboard"
  And see not "manager-mode"

Scenario: The app opens locked again
  Given click "btn-use"
  When store app opens
  Then on page "scan"

Scenario: A charge leaves the cash register on its own home screen
  Given camera shows "Dee"
  When click "btn-use"
  And input:
  | input-amount | input-description |
  | 12.50        | food!             |
  And click "btn-submit"
  And click "btn-done"
  Then on page "home"
  And see "notice"
  And see "btn-scan"
  And these "txs" rows:
  | uid1 | uid2 | agt2 | amt   | for2  |
  | Dee  | Cit  | Bea  | 12.50 | food! |

Rule: Pay / Refund and the account picture ask for a manager

Scenario: Pay / Refund asks for a manager
  Given click "btn-use"
  And click "btn-back"
  When click "btn-pay"
  Then see "manager-signin"
  And on page "home"

Scenario: The account picture asks for a manager
  Given click "btn-use"
  And click "btn-back"
  When click "btn-acct-menu"
  Then see "manager-signin"
  And see not "acct-menu"

Scenario: Cancel leaves it locked
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  When click "btn-cancel-manager"
  Then see not "manager-signin"
  And see not "manager-mode"

Rule: A manager's card or the signed-in member's password unlocks it, and it goes on to what was pressed

Scenario: The signed-in member's own card unlocks everything
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And camera shows "Bea"
  When click "btn-scan-in"
  Then on page "home"
  And see "manager-mode"
  And see "menu-accounts"
  And see "btn-pay"
  And these "app_tokens" rows:
  | uid | lockedTo | unlockedBy |
  | Bea | Cit      | Bea        |

Scenario: The password unlocks and opens the menu
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  When input "password": "k"
  And click "btn-unlock"
  Then see "manager-mode"
  And see "menu-settings"

Scenario: An unlock from Pay / Refund goes on to paying
  Given click "btn-use"
  And click "btn-back"
  And click "btn-pay"
  And click "btn-password"
  When input "password": "k"
  And click "btn-unlock"
  Then on page "scan"
  And see "manager-mode"

Scenario: A wrong password does not unlock
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  When input "password": "wrong"
  And click "btn-unlock"
  Then see "unlock-error"
  And see "manager-signin"
  And see not "manager-mode"

Scenario: The card of someone who does not manage the company does not unlock
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And camera shows "Dee"
  When click "btn-scan-in"
  Then see "unlock-error"
  And see "manager-signin"
  And see not "manager-mode"

Rule: Another manager's card opens only the company

Scenario: Another manager's card unlocks the company alone
  Given these "u_relations" rows:
  | main | other | permission |
  | Cit  | Dee   | manage     |
  And click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And camera shows "Dee"
  When click "btn-scan-in"
  Then see "manager-mode"
  And see "menu-settings"
  And see not "menu-accounts"
  And these "app_tokens" rows:
  | uid | lockedTo | unlockedBy |
  | Bea | Cit      | Dee        |

Scenario: Another manager's live session cannot change account
  Given these "u_relations" rows:
  | main | other | permission |
  | Cit  | Dee   | manage     |
  And click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And camera shows "Dee"
  And click "btn-scan-in"
  And click "btn-acct-menu"
  And click "btn-dashboard"
  Then on page ""

  When acting as "Bea"
  Then signed in as "Cit"

Rule: Manager Mode ends after a payment, on Exit, or after two minutes untouched

Scenario: Closing the settings leaves Manager Mode on
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  And input "password": "k"
  And click "btn-unlock"
  When click "menu-settings"
  And click "btn-back"
  Then on page "home"
  And see "manager-mode"
  And see "btn-dashboard"

Scenario: A charge leaves Manager Mode on
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  And input "password": "k"
  And click "btn-unlock"
  And click "btn-acct-menu"
  And camera shows "Dee"
  When click "btn-receive"
  And input:
  | input-amount | input-description |
  | 12.50        | food!             |
  And click "btn-submit"
  And click "btn-done"
  Then on page "home"
  And see "manager-mode"

Scenario: A payment ends Manager Mode
  Given click "btn-use"
  And click "btn-back"
  And click "btn-pay"
  And click "btn-password"
  And input "password": "k"
  And camera shows "Dee"
  And click "btn-unlock"
  When input:
  | input-amount | input-description |
  | 12.50        | refund!           |
  And click "btn-submit"
  And click "btn-done"
  Then on page "home"
  And see not "manager-mode"
  And see "btn-scan"
  And these "txs" rows:
  | uid1 | uid2 | agt1 | amt   | for2    |
  | Cit  | Dee  | Bea  | 12.50 | refund! |

Scenario: Exit locks it again
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  And input "password": "k"
  And click "btn-unlock"
  When click "btn-exit-manager"
  Then see not "manager-mode"
  And see "btn-scan"
  And these "app_tokens" rows:
  | uid | lockedTo | unlockedUntil |
  | Bea | Cit      |               |

Scenario: After a card unlock from Pay / Refund, the scanner does not take the manager's card as the one to pay
  Given click "btn-use"
  And click "btn-back"
  And click "btn-pay"
  And camera shows "Bea"
  When click "btn-scan-in"
  And wait 3 seconds
  Then on page "scan"
  And see "manager-mode"

Scenario: Manager Mode shows on the scanner too
  Given click "btn-use"
  And click "btn-back"
  And click "btn-pay"
  And click "btn-password"
  And input "password": "k"
  When click "btn-unlock"
  Then on page "scan"
  And see "manager-countdown"

Scenario: Two minutes untouched lock it again
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  And input "password": "k"
  And click "btn-unlock"
  Then see "manager-mode"

  When wait 121 seconds
  Then see not "manager-mode"
  And see "btn-scan"
  And these "app_tokens" rows:
  | uid | lockedTo | unlockedUntil |
  | Bea | Cit      |               |

Scenario: A touch keeps it unlocked another two minutes
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  And input "password": "k"
  And click "btn-unlock"
  Then see "manager-mode"

  Given wait 90 seconds
  And click "btn-acct-menu"
  When wait 90 seconds
  Then see "manager-mode"

Scenario: A touch on the Manager Mode banner does not keep it unlocked
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  And input "password": "k"
  And click "btn-unlock"
  Then see "manager-mode"

  Given wait 90 seconds
  And click "manager-mode-label"
  When wait 31 seconds
  Then see not "manager-mode"

Rule: A live-site session opened from the cash register lasts only while it is unlocked

Scenario: The live site shows Manager Mode, and Exit goes back to the app, locked
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  And input "password": "k"
  And click "btn-unlock"
  And click "btn-acct-menu"
  And click "btn-dashboard"
  Then on page ""
  And see "manager-mode"

  When click "btn-exit-manager"
  Then on page "scan"
  And see not "manager-mode"
  And these "app_tokens" rows:
  | uid | lockedTo | unlockedUntil |
  | Bea | Cit      |               |

Scenario: The live site goes back to the app after two minutes untouched
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  And input "password": "k"
  And click "btn-unlock"
  And click "btn-acct-menu"
  And click "btn-dashboard"
  Then on page ""

  When wait 121 seconds
  Then on page "scan"
  And these "app_tokens" rows:
  | uid | lockedTo | unlockedUntil |
  | Bea | Cit      |               |

Scenario: The live site goes back to the app when the unlock has ended on the server
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  And input "password": "k"
  And click "btn-unlock"
  And click "btn-acct-menu"
  And click "btn-dashboard"
  Then on page ""

  Given these "app_tokens" rows:
  | uid | unlockedUntil |
  | Bea | %now-1n       |
  When reload
  Then on page "scan"

Scenario: A member-site page goes back to the app when the unlock has ended on the server
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  And input "password": "k"
  And click "btn-unlock"
  And click "btn-acct-menu"
  And click "btn-dashboard"
  Then on page ""

  Given on PHP page "history"
  And these "app_tokens" rows:
  | uid | unlockedUntil |
  | Bea | %now-1n       |
  When reload
  Then on page "scan"

Rule: Offline, a manager's card unlocks if it unlocked this device online before

Scenario: A card that unlocked online before unlocks offline
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And camera shows "Bea"
  And click "btn-scan-in"
  And click "btn-exit-manager"
  And network off
  When click "btn-acct-menu"
  And click "btn-scan-in"
  Then on page "home"
  And see "manager-mode"
  And see "menu-settings"
  And see not "menu-accounts"

Scenario: A payment after an offline card unlock is sent when the connection returns
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And camera shows "Bea"
  And click "btn-scan-in"
  And click "btn-exit-manager"
  Then these "app_tokens" rows:
  | uid | lockedTo | unlockedUntil |
  | Bea | Cit      |               |

  Given network off
  And click "btn-pay"
  And click "btn-scan-in"
  Then on page "scan"
  And see "manager-mode"

  Given click "btn-back"
  And camera shows "Dee"
  When click "btn-pay"
  And click "btn1"
  And input:
  | input-amount | input-description |
  | 12.50        | refund!           |
  And click "btn-submit"
  And click "btn-done"
  Then on page "home"
  And see "queued"
  And see not "manager-mode"
  And count "txs" is 0

  When network on
  Then these "txs" rows:
  | uid1 | uid2 | agt1 | amt   | for2    |
  | Cit  | Dee  | Bea  | 12.50 | refund! |

Scenario: A card that never unlocked online does not unlock offline
  Given click "btn-use"
  And click "btn-back"
  And network off
  And click "btn-acct-menu"
  And camera shows "Bea"
  When click "btn-scan-in"
  Then see "unlock-error"

Rule: The owner-operated setting turns the lock off on this device

Scenario: A manager turns the lock off
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  And input "password": "k"
  And click "btn-unlock"
  And click "menu-settings"
  When click "set-ownerOperated"
  Then checked "set-ownerOperated"
  And these "app_tokens" rows:
  | uid | lockedTo |
  | Bea |          |

  When store app opens
  Then on page ""
  And signed in as "Cit"

Scenario: The owner-operated setting survives a change of account
  Given click "btn-use"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "btn-password"
  And input "password": "k"
  And click "btn-unlock"
  And click "menu-settings"
  And click "set-ownerOperated"
  And click "btn-back"
  And click "btn-acct-menu"
  And click "menu-accounts"
  And select "account": "Bea Two"
  And click "btn-use"
  And click "btn-acct-menu"
  And click "menu-accounts"
  And select "account": "Citre"
  When click "btn-use"
  Then on page ""
  And signed in as "Cit"
  And these "app_tokens" rows:
  | uid | lockedTo |
  | Bea |          |
