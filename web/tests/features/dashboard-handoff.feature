Feature: Dashboard transaction handoff
  As a member using a camera-enabled device
  I can open the existing CGPay scan flow from the dashboard
  And return to the dashboard when I am done, with a message if something went wrong

Rule: With a camera, Pay and Charge lead to the legacy app

Scenario: A camera-enabled device uses the legacy CGPay app
  Given signed in as "Bea"
  When camera "present"
  Then pay and charge go to "legacy app"

Scenario: A device without a camera keeps the PHP transaction links
  Given signed in as "Bea"
  When camera "absent"
  Then pay and charge go to "PHP"

Rule: A member pays in the legacy app and returns to the dashboard

Scenario: A member pays another member and comes back to the dashboard
  Given signed in as "Bea"
  And camera shows "Dee"
  When click "btn-pay"
  Then on page "tx-start"
  And see "btn-scan"
  And see "btn-type"
  And see not "btn-nav"
  When click "btn-scan"
  Then on page "tx"
  And text "theirName": "Dee Four"
  When input:
  | input-amount | input-description |
  | 2.34         | handoff!          |
  And click "btn-submit"
  Then see "tx-summary"
  When click "btn-done"
  Then on page ""
  And these "txs" rows:
  | uid1 | uid2 | amt  | for1     |
  | Bea  | Dee  | 2.34 | handoff! |
  And see "balance"

Scenario: A member undoes the payment and the dashboard shows no transaction
  Given signed in as "Bea"
  And camera shows "Dee"
  When click "btn-pay"
  And click "btn-scan"
  Then text "theirName": "Dee Four"
  When input:
  | input-amount | input-description |
  | 2.34         | handoff!          |
  And click "btn-submit"
  And click "btn-undo"
  And click "btn1"
  Then on page ""
  And see "notice-info"
  And text "msg": "The transaction has been reversed."
  And count "txs" is 0

Rule: A company goes straight to scanning

Scenario: A company has nothing to show, so it starts on the scan page and can go back
  Given signed in as "Bea"
  And acting as "Cit"
  When click "btn-receive"
  Then on page "scan"
  And see not "btn-nav"
  When click "btn-back"
  Then on page ""

Rule: A problem in the legacy app returns the member to the dashboard with a message

Scenario: A member scans their own QR code
  Given signed in as "Bea"
  And camera shows "Bea"
  When click "btn-pay"
  And click "btn-scan"
  Then on page ""
  And see "notice-error"
  And text "msg": "That QR is for the same account as yours."
  When click "msg-close"
  Then see not "notice-error"
