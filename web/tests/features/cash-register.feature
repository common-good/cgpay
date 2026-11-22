Feature: A company account as a cash register
  As a manager of a company
  I leave the store app on the company's account for a cashier
  So the cashier can charge customers but reach nothing else, until a manager unlocks it.

  Bea manages Citre. A company account opens to Charge, locked: the home screen offers only Charge and Manager.
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

Scenario: The locked home screen offers only Charge and Manager
  Given click "btn-use"
  When click "btn-back"
  Then on page "home"
  And see "btn-receive"
  And see "btn-manager"
  And see not "btn-acct-menu"
  And see not "btn-pay"
  And see not "btn-dashboard"

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
  And see "btn-manager"
  And these "txs" rows:
  | uid1 | uid2 | agt2 | amt   | for2  |
  | Dee  | Cit  | Bea  | 12.50 | food! |

Rule: A manager's card or the signed-in member's password unlocks it

Scenario: The signed-in member's own card unlocks everything
  Given click "btn-use"
  And click "btn-back"
  And click "btn-manager"
  And camera shows "Bea"
  When click "btn-scan-manager"
  Then on page "home"
  And see "btn-acct-menu"
  And see "btn-pay"
  And see "btn-lock"
  And these "app_tokens" rows:
  | uid | lockedTo | unlockedBy |
  | Bea | Cit      | Bea        |

Scenario: The password unlocks
  Given click "btn-use"
  And click "btn-back"
  And click "btn-manager"
  When input "password": "k"
  And click "btn-unlock"
  Then on page "home"
  And see "btn-pay"

Scenario: A wrong password does not unlock
  Given click "btn-use"
  And click "btn-back"
  And click "btn-manager"
  When input "password": "wrong"
  And click "btn-unlock"
  Then see "unlock-error"
  And on page "register-unlock"

Scenario: The card of someone who does not manage the company does not unlock
  Given click "btn-use"
  And click "btn-back"
  And click "btn-manager"
  And camera shows "Dee"
  When click "btn-scan-manager"
  Then see "unlock-error"
  And on page "register-unlock"

Rule: Another manager's card opens only the company

Scenario: Another manager's card unlocks the company alone
  Given these "u_relations" rows:
  | main | other | permission |
  | Cit  | Dee   | manage     |
  And click "btn-use"
  And click "btn-back"
  And click "btn-manager"
  And camera shows "Dee"
  When click "btn-scan-manager"
  Then see "btn-lock"
  And these "app_tokens" rows:
  | uid | lockedTo | unlockedBy |
  | Bea | Cit      | Dee        |

  When click "btn-acct-menu"
  Then see "menu-settings"
  And see not "menu-accounts"

Scenario: Another manager's live session cannot change account
  Given these "u_relations" rows:
  | main | other | permission |
  | Cit  | Dee   | manage     |
  And click "btn-use"
  And click "btn-back"
  And click "btn-manager"
  And camera shows "Dee"
  And click "btn-scan-manager"
  And click "btn-dashboard"
  Then on page ""

  When acting as "Bea"
  Then signed in as "Cit"

Rule: The unlock ends when its activity is over

Scenario: Closing the settings locks it again
  Given click "btn-use"
  And click "btn-back"
  And click "btn-manager"
  And input "password": "k"
  And click "btn-unlock"
  When click "btn-acct-menu"
  And click "menu-settings"
  And click "btn-back"
  Then on page "home"
  And see "btn-manager"
  And these "app_tokens" rows:
  | uid | lockedTo | unlockedUntil |
  | Bea | Cit      |               |

Scenario: Lock locks it again
  Given click "btn-use"
  And click "btn-back"
  And click "btn-manager"
  And input "password": "k"
  And click "btn-unlock"
  When click "btn-lock"
  Then see "btn-manager"
  And see not "btn-pay"

Scenario: Two minutes untouched lock it again
  Given click "btn-use"
  And click "btn-back"
  And click "btn-manager"
  And input "password": "k"
  And click "btn-unlock"
  Then see "btn-lock"

  When wait 121 seconds
  Then see "btn-manager"
  And see not "btn-pay"
  And these "app_tokens" rows:
  | uid | lockedTo | unlockedUntil |
  | Bea | Cit      |               |

Scenario: A touch keeps it unlocked another two minutes
  Given click "btn-use"
  And click "btn-back"
  And click "btn-manager"
  And input "password": "k"
  And click "btn-unlock"
  Then see "btn-lock"

  Given wait 90 seconds
  And click "btn-acct-menu"
  When wait 90 seconds
  Then see "btn-lock"

Rule: A live-site session opened from the cash register lasts only while it is unlocked

Scenario: The live site goes back to the app after two minutes untouched
  Given click "btn-use"
  And click "btn-back"
  And click "btn-manager"
  And input "password": "k"
  And click "btn-unlock"
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
  And click "btn-manager"
  And input "password": "k"
  And click "btn-unlock"
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
  And click "btn-manager"
  And input "password": "k"
  And click "btn-unlock"
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
  And click "btn-manager"
  And camera shows "Bea"
  And click "btn-scan-manager"
  And click "btn-lock"
  And network off
  When click "btn-manager"
  And click "btn-scan-manager"
  Then on page "home"
  And see "btn-lock"

  When click "btn-acct-menu"
  Then see "menu-settings"
  And see not "menu-accounts"

Scenario: A card that never unlocked online does not unlock offline
  Given click "btn-use"
  And click "btn-back"
  And network off
  And click "btn-manager"
  And camera shows "Bea"
  When click "btn-scan-manager"
  Then see "unlock-error"

Rule: The owner-operated setting turns the lock off on this device

Scenario: A manager turns the lock off
  Given click "btn-use"
  And click "btn-back"
  And click "btn-manager"
  And input "password": "k"
  And click "btn-unlock"
  And click "btn-acct-menu"
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
  And click "btn-manager"
  And input "password": "k"
  And click "btn-unlock"
  And click "btn-acct-menu"
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
