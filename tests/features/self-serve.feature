@all @self
Feature: Self Serve Mode
 As a vendor
 I can set the CGPay app to Self Serve mode
 So that customers can use it to charge themselves without having administrative privileges.

Background:
 * context

Rule: Business accounts have the option to enter self serve mode

Scenario: A business account is linked to my device
  When A business account is linked to my device
  Then ? The navigation shows an option for Self Serve Mode

Scenario: I am in Self Serve mode
  When I am in Self Serve mode
  Then ? The only navigation option is to exit Self Serve

Scenario: I exit Self Serve mode
  When I exit self serve mode
  Then ? The app signs me out