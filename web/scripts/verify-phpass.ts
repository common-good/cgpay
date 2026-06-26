#!/usr/bin/env tsx
// One-off CLI to verify a Drupal phpass hash against a plaintext password using
// our port of password.inc. Exits 0 on match, 1 on mismatch.
//
// Usage:
//   npm run verify-phpass -- '$S$EXAMPLEHASH…' 'thepassword'
//
// Pull a real hash from staging with (read-only DB user, tunneled):
//   SELECT name, pass FROM users WHERE name = 'the-test-account' LIMIT 1;

import { checkPassword } from '../src/lib/server/drupal-password.js'

const [hash, password] = process.argv.slice(2)

if (!hash || !password) {
  console.error('Usage: npm run verify-phpass -- <hash> <password>')
  process.exit(2)
}

const ok = checkPassword(password, hash)

if (ok) {
  console.log('MATCH — password verifies against the hash.')
  process.exit(0)
} else {
  console.error('NO MATCH — password does not verify.')
  process.exit(1)
}
