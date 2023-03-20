Feature: Pay

Background:
 * context

Rule: The app will cache transactions that occur offline and complete them once the app is reconnected to the internet

Scenario: I charge another user while offline
  When I am offline
  Then ? The app displays an offline status 

Scenario: I charge another user while offline
  When I charge another user while offline
  Then ? The app caches the transaction to be completed when I reconnect

Scenario: I reconnect to the internet
  When I reconnect to the internet with cached transactions
  Then ? The app completes the cached transactions
