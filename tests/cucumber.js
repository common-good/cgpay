// cucumber.js
let options = [
  'tests/features/**/*.feature',         // Specify our feature files
  '--require tests/steps/**/*.js',       // Load step definitions
  '--require tests/support/world.js',    // what to run before and after tests
  '--format progress-bar',               // Load custom formatter
//'--format @cucumber/pretty-formatter', // Load custom formatter (works, but it's nothing special)
  '--publish-quiet'                      // Suppress the "Share your Cucumber Report" message (see below)
].join(' ');

module.exports = {
  default: options
};

/* 
│ Share your Cucumber Report with your team at https://reports.cucumber.io     │
│                                                                              │
│ Command line option:    --publish                                            │
│ Environment variable:   CUCUMBER_PUBLISH_ENABLED=true                        │
│                                                                              │
│ More information at https://cucumber.io/docs/cucumber/environment-variables/
*/
