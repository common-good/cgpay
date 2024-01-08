export default [
  'tests/features/**/*.feature',         // Specify our feature files
  '--import tests/support/steps.js',     // Load step definitions
  '--import tests/support/hooks.js',     // what to run before and after tests
  '--format progress-bar'                // Load custom formatter
//'--format @cucumber/pretty-formatter', // Load custom formatter (works, but it's nothing special)
].join(' ');
