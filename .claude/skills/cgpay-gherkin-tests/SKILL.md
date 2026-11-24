---
name: cgpay-gherkin-tests
description: Write or change cgpay E2E tests as Gherkin features (playwright-bdd): feature files, steps, support functions, magic values, test accounts. Use for any work in web/tests/features, web/tests/steps or web/tests/support.
---

## E2E: write new tests as Gherkin features

Plain specs (`web/tests/e2e/`) are being replaced gradually by Gherkin features (`web/tests/features/`, steps in `web/tests/steps/`) run with `playwright-bdd`. Layout, commands, and test-endpoint setup are in `web/tests/README.md`. The essentials:

- All steps are one-liners in `tests/steps/steps.ts` that call `t.something` (`tests/support/t.ts`). Run `npm run bddgen` after editing a feature or step.
- One worker only (shared test DB, in-memory rate limiter). Scenarios must be independent: set up state in fixtures, never rely on a previous scenario.
- The Gherkin project is skipped in CI: its `testDb` fixture needs the PHP test endpoint (`testops()` in cgmembers-frame `forms/api.inc`, which answers only on a developer's own machine and in the feature tests).
- Scenarios refer to the standard test accounts by first name (Abe, Bea, Cit, ...). These are the PHP accounts `.ZPA`, `.ZPB`, ... (`NEWZPA`...; the same accounts as the legacy app's `K6...` ids). cgmembers-frame's own features use other uids (`.ZZA`...); in cgpay features always use the names.
- Write a BDD feature test for every new feature, and for existing functionality you touch.
- Reuse existing steps as much as possible.
- Avoid steps that match literal text (`I see text "..."`). Refer to a marker for the text instead (a `data-testid`), so the wording can be tweaked without changing the test or its purpose. `see "..."` accepts literal text so a first version of a test is quick to write; replace it with a marker when the test is finalized.
- Test accounts: Bea is an individual account, Citre a company account, Dee a second individual account. Abe is an admin account, used only for admin actions. Gisette (managed by Flo) is the fiscally sponsored company; the other accounts, listed in `web/tests/support/accounts.ts`, are available if needed.
- Tests cover not only what the user sees but also the resulting state of the data. Check the data after the action (`these "grants" rows:`, `count "txs" is N`), and let one test's resulting data be the starting point of another (`Given these "users" rows:`). That tests a process from the start to the middle and from the middle to the end, not only end to end, which clarifies the data structure strategy and reduces the number and complexity of tests needed.
- Group scenarios under the business rule they illustrate with Gherkin's `Rule:` keyword.
- The legacy PWA's cucumber suite (top-level `tests/`, `npm test` at the repo root) is the model for how steps are organized: one-line steps, each calling a support function.

## Writing features and steps

- Steps are terse: no "I" or "we" (`click "btn-report"`, `see not "ckNum"`, `error "..."`).
- Given is context, named as a state (`signed in as`, `acting as`, `on page`). When is the one action under test, an imperative (`input`, `select`, `click`, `camera`). Then is the outcome. Never use `*` as a step keyword.
- To enter two or more values use `input:` with a table (element ids in the header row, one row of values; selects work too). For one value use `input "x": "y"` or `select "x": "y"`.
- A step with a table argument ends with the table's shape: `values:`, `rows:`, `row:`, `rows pivoted:`, `row pivoted:` or `values pivoted:`. `Then these "x" rows:` means the app includes those rows (any order, more allowed); use `count "x" is N` for an exact number.
- In a scenario, a Given or When that comes after a Then starts a new part of the story: put a blank line before it (and before its group, if And steps follow). A unit test checks it.
- Pages are literal paths without the leading slash: `on page "grants/new"`, and `on page ""` for the dashboard.
- Magic values: account nicknames are bare (`Abe`, `Bea`); everything else starts with `%` (`%now`, `%ymd-3d`, `%random3`, and `%name` for a variable defined with `var "name" is "..."`). The full list is at the top of `tests/support/magic.ts`. Tests run in the America/New_York time zone.
- `steps.ts` has the GWhen steps (valid after Given or When), one blank line, then the Then steps; each section is alphabetical by step text without its arguments (a unit test checks it). Support functions for Then steps start with `so`.

