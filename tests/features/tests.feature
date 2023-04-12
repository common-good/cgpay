@all @tests
Feature: Test tests

Background:

Scenario: this
  Given this "qr": "zqx3"
  Then ? this "qr": "zqx3"

  Given this "qr": "Bea"
  Then ? this "qr": "Bea"
  And ? this "qr": "HTTP://6VM.RC4.ME/KDCB12345b"

  Given this "qr":
  | one | two | account |
  | 1   | 2   | Bea     |
  Then ? this "qr":
  | one | two | account |
  | 1   | 2   | Bea     |
  And ? this "qr":
  | one | two | account |
  | 1   | 2   | { name:'Bea Two', location:'Bton, MA', isCo:false, accountId:'K6VMDCB', cardCode:'12345b', deviceId:'devB', selling:null } |

  Given this "qr":
  | actorId | otherId |
  | Abe     | Bea     |
  Then ? this "qr":
  | actorId | otherId |
  | Abe     | Bea     |
  And ? this "qr":
  | actorId | otherId |
  | K6VMDCA | K6VMDCB |

  Given this "qr":
  | one  | created | three | four  | five | six | seven |
  | null | now     | true  | false | []   | {}  | other |
  Then ? this "qr":
  | one  | created | three | four  | five | six | seven |
  | null | now     | true  | false | []   | {}  | other |
  And ? this "qr":
  | one  | created | three | four  | five | six | seven   |
  | null | now     | true  | false | []   | {}  | garbage |

Scenario: these1
  Given these "qr":
  | one | two | account |
  | 1   | 2   | Bea     |
  Then ? these "qr":
  | one | two | account |
  | 1   | 2   | Bea     |
  And ? these "qr":
  | one | two | account |
  | 1   | 2   | { name:'Bea Two', location:'Bton, MA', isCo:false, accountId:'K6VMDCB', cardCode:'12345b', deviceId:'devB', selling:null } |

  Given these "qr":
  | actorId | otherId |
  | Abe     | Bea     |
  Then ? these "qr":
  | actorId | otherId |
  | Abe     | Bea     |
  And ? these "qr":
  | actorId | otherId |
  | K6VMDCA | K6VMDCB |

  Given these "qr":
  | one  | two | three | four  | five | six | seven |
  | null | now | true  | false | []   | {}  | other |
  Then ? these "qr":
  | one  | two | three | four  | five | six | seven |
  | null | now | true  | false | []   | {}  | other |
  And ? these "qr":
  | one  | two | three | four  | five | six | seven   |
  | null | now | true  | false | []   | {}  | garbage |

Scenario: these2
  Given these "qr":
  | one | two | account |
  | 1   | 2   | Bea     |
  | 3   | 4   | Abe/Cit |
  Then ? these "qr":
  | one | two | account |
  | 1   | 2   | Bea     |
  | 3   | 4   | Abe/Cit |
  And ? these "qr":
  | one | two | account |
  | 1   | 2   | { name:'Bea Two', location:'Bton, MA', isCo:false, accountId:'K6VMDCB', cardCode:'12345b', deviceId:'devB', selling:null }                             |
  | 3   | 4   | { name:'Citre', location:'Cton, MA', isCo:true, accountId:'L6VMDCC0', cardCode:'98765a', deviceId:'devC', selling:['groceries', 'gifts', 'sundries'] } |

  Given these "qr":
  | actorId | otherId |
  | Abe     | Bea     |
  | Dee     | Eli     |
  Then ? these "qr":
  | actorId | otherId |
  | Abe     | Bea     |
  | Dee     | Eli     |
  And ? these "qr":
  | actorId | otherId |
  | K6VMDCA | K6VMDCB |
  | K6VMDCD | K6VMDCE |

Scenario: myAccount
  Given I am signed in as "Bea"
  Then ? I am signed in as "Bea"
  And ? this "myAccount": "{ name:'Bea Two', isCo:false, accountId:'K6VMDCB', deviceId:'devB', selling:null }"

Scenario: theseAccts/accounts (notice no quotes around "accounts")
  Given these accounts:
  | Abe | Bea | Bea/Cit |
  Then ? these accounts:
  | Abe | Bea | Bea/Cit |
#  And ? these "accts" keyed by "accountId":
#  | name    | agent   | location | hash  |
#  | Abe One | null    | Aton, MA | !null |
#  | Bea Two | null    | Bton, MA | !null |
#  | Citre   | Bea Two | Cton, MA | !null |

#  Given ? these "accts" keyed by "accountId"
#  | name    | agent   | location |
#  | Abe One | null    | Aton, MA |
#  | Bea Two | null    | Bton, MA |
#  | Citre   | Bea Two | Cton, MA |
#  Then ? these accounts:
#  | Abe | Bea | Bea/Cit |

Scenario: theseAccts/choices (notice no quotes around "choices")
  Given these choices:
  | Abe | Bea | Bea/Cit |
  Then ? these choices:
  | Abe | Bea | Bea/Cit |
  And ? these "choices":
  | name    | isCo  | accountId | deviceId | selling |
  | Abe One | false | K6VMDCA   | devA     | null    |
  | Bea Two | false | K6VMDCB   | devB     | null    |
  | Citre   | true  | L6VMDCC1  | devC     | ['groceries', 'gifts', 'sundries'] |

  Given these "choices":
  | name    | isCo  | accountId | deviceId | selling |
  | Abe One | false | K6VMDCA   | devA     | null    |
  | Bea Two | false | K6VMDCB   | devB     | null    |
  | Citre   | true  | L6VMDCC1  | devC     | ['groceries', 'gifts', 'sundries'] |
  Then ? these choices:
  | Abe | Bea | Bea/Cit |

  Given these choices:
  | Abe |
  Then ? this "choices":
  | { name:'Abe One', isCo:false, accountId:'K6VMDCA', deviceId:'devA', selling:null } |

  Given this "choices":
  | { name:'Abe One', isCo:false, accountId:'K6VMDCA', deviceId:'devA', selling:null } |
  Then ? these choices:
  | Abe |
