Feature: QR attribution (cg4.us a= / w= / q= scans)
  As Common Good
  I want every QR scan and tagged link to stamp an attribution cookie
  So that signup can attribute the member to every source they touched

Background:
  Given signed in as "nobody"

Rule: An a= scan stamps the ad cookie and lands the member on /welcome

  Scenario: A cg4.us a= scan lands on /welcome and stamps the ad cookie
    When on page "a=cge2606"
    Then on page "welcome"
    And cookie "ad" is "a:cge2606"

Rule: A q= scan does the same (company QR)

  Scenario: A cg4.us q= scan lands on /welcome and stamps the ad cookie
    When on page "q=xyz123"
    Then on page "welcome"
    And cookie "ad" is "q:xyz123"

Rule: Multiple scans accumulate in the cookie, oldest first

  Scenario: Two scans in a row accumulate space-separated
    When on page "a=first"
    Then on page "welcome"

    When on page "q=second"
    Then on page "welcome"
    And cookie "ad" is "a:first q:second"
