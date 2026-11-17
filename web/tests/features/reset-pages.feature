Feature: Password reset (the three pages)
  As a member who forgot the password
  I want the three /reset pages to guide me through a new one
  So that I can sign in again without anyone's help

Background:
  Given signed in as "nobody"

Rule: The identifier page shows the inline error before sending a code

  Scenario: Empty identifier shows the inline error
    When on page "reset"
    And click "btn-send-code"
    Then error "Please enter your account ID, email, or phone."
    And on page "reset"

Rule: The verify page refuses a code that is not six digits

  Scenario: A wrong-shape code is refused inline
    When on page "reset"
    And input:
    | identifier |
    | Bea        |
    And click "btn-send-code"
    Then on page "reset/verify"

    When input:
    | code |
    | 123  |
    And click "btn-verify"
    Then error "The code is 6 digits - check the email or text."
    And on page "reset/verify"

Rule: The password page shows the server's reason when the password is too weak and the code stays usable

  Scenario: A weak password surfaces PHP's reason and the code is not spent
    Given these "reset_codes" rows:
    | uid | code   |
    | Bea | 123456 |

    When on page "reset"
    And input:
    | identifier |
    | Bea        |
    And click "btn-send-code"
    Then on page "reset/verify"

    When input:
    | code   |
    | 123456 |
    And click "btn-verify"
    Then on page "reset/password"

    When input:
    | password  | confirm-password |
    | newpass99 | newpass99        |
    And click "btn-set-password"
    Then on page "reset/password"
    And error "You need to choose a password that is harder to guess."
    And these "reset_codes" rows:
    | uid | tries | usedAt |
    | Bea | 0     |        |

Rule: A wrong code at the final submit bounces back to /reset/verify (identifier kept, code dropped)

  Scenario: A wrong code at submit bounces back to /reset/verify
    Given these "reset_codes" rows:
    | uid | code   |
    | Bea | 123456 |

    When on page "reset"
    And input:
    | identifier |
    | Bea        |
    And click "btn-send-code"
    Then on page "reset/verify"

    When input:
    | code   |
    | 654321 |
    And click "btn-verify"
    Then on page "reset/password"

    When input:
    | password      | confirm-password |
    | Tulip-Rain-42 | Tulip-Rain-42    |
    And click "btn-set-password"
    Then on page "reset/verify"

Rule: A right code with a strong password signs the member in

  Scenario: A right code + strong password signs the member in
    Given these "reset_codes" rows:
    | uid | code   |
    | Bea | 123456 |

    When on page "reset"
    And input:
    | identifier |
    | Bea        |
    And click "btn-send-code"
    Then on page "reset/verify"

    When input:
    | code   |
    | 123456 |
    And click "btn-verify"
    Then on page "reset/password"

    When input:
    | password      | confirm-password |
    | Tulip-Rain-42 | Tulip-Rain-42    |
    And click "btn-set-password"
    Then on page ""
    And signed in as "Bea"
    And count "reset_codes" is 0
