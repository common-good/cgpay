@all @offline
Feature: Offline
  As a vendor or individual
  I will see a banner when my network goes offline
  So that I am aware if the network is offline.

  As a vendor
  I can charge customers in offline mode
  So that my business is not interrupted.

Background:

Rule: The app will cache transactions that occur offline and complete them once the app is reconnected to the internet

Scenario: The network goes offline and status is visible
  When The network is offline
  Then ? the offline status is visible

Scenario: I charge another user while offline
  When I am offline
  Then ? The app displays an offline status 

Scenario: I charge another user while offline
  When I charge another user while offline
  Then ? The app caches the transaction to be completed when I reconnect

Scenario: I reconnect to the internet
  When I reconnect to the internet with cached transactions
  Then ? The app completes the cached transactions
