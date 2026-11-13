Feature: Password reset
  As a member who forgot the password
  I want a code sent to me that lets me choose a new one
  So that I can sign in again without anyone's help

  Rule: Asking for a code looks the same whether or not the account exists

    Scenario: A code is requested for an account
      When post "reset-request":
      | identifier | channel |
      | Bea        | email   |
      Then reply row:
      | http | status    |
      | 200  | code_sent |
      And these "reset_codes" rows:
      | uid | channel | tries | usedAt |
      | Bea | email   | 0     |        |

    Scenario: A code is requested for an account that does not exist
      When post "reset-request":
      | identifier | channel |
      | NEWZZZ     | email   |
      Then reply row:
      | http | status    |
      | 200  | code_sent |
      And count "reset_codes" is 0

    Scenario: A second code is requested right away
      Given these "reset_codes" rows:
      | uid | code   |
      | Bea | 123456 |

      When post "reset-request":
      | identifier | channel |
      | Bea        | email   |
      Then reply row:
      | http | status    |
      | 200  | code_sent |
      And count "reset_codes" is 1

    Scenario: A code is requested by a channel that does not exist
      When post "reset-request":
      | identifier | channel |
      | Bea        | pigeon  |
      Then reply row:
      | http | errors.channel |
      | 400  | ?              |
      And count "reset_codes" is 0

  Rule: The right code, used once in time, lets the member choose a new password

    Scenario: The right code is entered
      Given these "reset_codes" rows:
      | uid | code   |
      | Bea | 123456 |

      When post "reset-verify":
      | identifier | code   | newPassword |
      | Bea        | 123456 | newpass99   |
      Then reply row:
      | http |
      | 200  |
      And count "reset_codes" is 0

      When post "login":
      | identifier | password  |
      | Bea        | newpass99 |
      Then reply row:
      | http |
      | 200  |

    Scenario: The wrong code is entered
      Given these "reset_codes" rows:
      | uid | code   |
      | Bea | 123456 |

      When post "reset-verify":
      | identifier | code   | newPassword |
      | Bea        | 654321 | newpass99   |
      Then reply row:
      | http | errors.code |
      | 400  | ?           |
      And these "reset_codes" rows:
      | uid | tries | usedAt |
      | Bea | 1     |        |

      When post "login":
      | identifier | password |
      | Bea        | k        |
      Then reply row:
      | http |
      | 200  |

    Scenario: The right code is entered too late
      Given these "reset_codes" rows:
      | uid | code   | expires |
      | Bea | 123456 | %now-1n |

      When post "reset-verify":
      | identifier | code   | newPassword |
      | Bea        | 123456 | newpass99   |
      Then reply row:
      | http | errors.code |
      | 400  | ?           |
      And these "reset_codes" rows:
      | uid | usedAt |
      | Bea |        |

    Scenario: The right code is entered after five wrong ones
      Given these "reset_codes" rows:
      | uid | code   | tries |
      | Bea | 123456 | 5     |

      When post "reset-verify":
      | identifier | code   | newPassword |
      | Bea        | 123456 | newpass99   |
      Then reply row:
      | http | errors.code |
      | 400  | ?           |

    Scenario: The right code is entered with a password that is too short
      Given these "reset_codes" rows:
      | uid | code   |
      | Bea | 123456 |

      When post "reset-verify":
      | identifier | code   | newPassword |
      | Bea        | 123456 | short       |
      Then reply row:
      | http | errors.newPassword |
      | 400  | ?                  |
      And these "reset_codes" rows:
      | uid | tries | usedAt |
      | Bea | 0     |        |
