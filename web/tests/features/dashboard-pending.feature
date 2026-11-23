Feature: Dashboard pending payments and receivables
  As a member
  I can see the total of every payment and charge still pending
  And a list of the newest ones

Rule: The totals count every pending invoice, however many there are

Scenario: A member owes on more invoices than the list shows
  Given these "tx_requests" rows:
  | payer | payee | amount | purpose  | created  |
  | Bea   | Dee   | 1      | bill 1   | %now-1h  |
  | Bea   | Dee   | 1      | bill 2   | %now-2h  |
  | Bea   | Dee   | 1      | bill 3   | %now-3h  |
  | Bea   | Dee   | 1      | bill 4   | %now-4h  |
  | Bea   | Dee   | 1      | bill 5   | %now-5h  |
  | Bea   | Dee   | 1      | bill 6   | %now-6h  |
  | Bea   | Dee   | 1      | bill 7   | %now-7h  |
  | Bea   | Dee   | 1      | bill 8   | %now-8h  |
  | Bea   | Dee   | 1      | bill 9   | %now-9h  |
  | Bea   | Dee   | 1      | bill 10  | %now-10h |
  | Bea   | Dee   | 1      | bill 11  | %now-11h |
  | Bea   | Dee   | 1      | bill 12  | %now-12h |
  | Bea   | Dee   | 1      | bill 13  | %now-13h |
  | Bea   | Dee   | 1      | bill 14  | %now-14h |
  | Bea   | Dee   | 1      | bill 15  | %now-15h |
  | Bea   | Dee   | 1      | bill 16  | %now-16h |
  | Bea   | Dee   | 1      | bill 17  | %now-17h |
  | Bea   | Dee   | 1      | bill 18  | %now-18h |
  | Bea   | Dee   | 1      | bill 19  | %now-19h |
  | Bea   | Dee   | 1      | bill 20  | %now-20h |
  | Bea   | Dee   | 10     | old bill | %now-30d |
  And signed in as "Bea"
  And on page ""
  Then text "btn-pending-pay": "Pending: $30.00"

  When click "btn-pending-pay"
  Then text "pending-more": "The newest 20 of 21."
  And see "bill 1"
  And see not "old bill"

Rule: Newer completed transactions do not push pending invoices out of the list

Scenario: A member has an old invoice to pay and many payments since
  Given these "tx_requests" rows:
  | payer | payee | amount | purpose  | created  |
  | Bea   | Dee   | 7      | old bill | %now-30d |
  And these "txs" rows:
  | uid1 | uid2 | amt | for1  | for2  | created  |
  | Bea  | Dee  | 1   | lunch | lunch | %now-1h  |
  | Bea  | Dee  | 1   | lunch | lunch | %now-2h  |
  | Bea  | Dee  | 1   | lunch | lunch | %now-3h  |
  | Bea  | Dee  | 1   | lunch | lunch | %now-4h  |
  | Bea  | Dee  | 1   | lunch | lunch | %now-5h  |
  | Bea  | Dee  | 1   | lunch | lunch | %now-6h  |
  | Bea  | Dee  | 1   | lunch | lunch | %now-7h  |
  | Bea  | Dee  | 1   | lunch | lunch | %now-8h  |
  | Bea  | Dee  | 1   | lunch | lunch | %now-9h  |
  | Bea  | Dee  | 1   | lunch | lunch | %now-10h |
  | Bea  | Dee  | 1   | lunch | lunch | %now-11h |
  | Bea  | Dee  | 1   | lunch | lunch | %now-12h |
  | Bea  | Dee  | 1   | lunch | lunch | %now-13h |
  | Bea  | Dee  | 1   | lunch | lunch | %now-14h |
  | Bea  | Dee  | 1   | lunch | lunch | %now-15h |
  | Bea  | Dee  | 1   | lunch | lunch | %now-16h |
  | Bea  | Dee  | 1   | lunch | lunch | %now-17h |
  | Bea  | Dee  | 1   | lunch | lunch | %now-18h |
  | Bea  | Dee  | 1   | lunch | lunch | %now-19h |
  | Bea  | Dee  | 1   | lunch | lunch | %now-20h |
  And signed in as "Bea"
  And on page ""
  When click "btn-pending-pay"
  Then see "old bill"
  And see not "pending-more"
