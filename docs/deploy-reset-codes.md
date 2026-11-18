# Deploying the password-reset backend

The node app now stores password-reset codes itself, so its database user needs write access to one table. This page is the order of steps for each environment. It holds no server details; see `docs/infrastructure.md` for where things live.

## What changed

- New table `reset_codes` (cgmembers-frame Phinx migration `20261107093900_reset_codes`). Only the node app writes to it.
- cgpay's database user is no longer read-only. It is named `<env>_cgpay` and has SELECT on the whole environment database, plus INSERT, UPDATE and DELETE on the tables listed in `ALLOWLIST` in `web/src/lib/server/data.ts` (today: `reset_codes`). It has no other write rights.
- Two cgmembers-frame endpoints deliver a code (email or text) and set the new password: `cgpay/reset-deliver` and `cgpay/reset-complete`. The node app calls them with the shared secret.
- `web/.env.example` now defaults `DB_USER` to `test_cgpay`.

## Order, per environment

1. Deploy cgmembers-frame `develop`. The deploy runs `phinx migrate`, which creates `reset_codes`. Check: `select count(*) from reset_codes` works.
2. Create the user with the statements under "The database user" below (after step 1: a grant on a missing table fails).
3. In the environment's cgpay `.env`, set `DB_USER=<env>_cgpay` and the new `DB_PASSWORD` (keep the comments and variable order of `.env.example`).
4. Deploy cgpay `develop` (this restarts the pm2 process, so the new `.env` is read).
5. Rebuild the cgmembers-frame menu if the deploy added routes (`cgpay/reset-deliver`, `cgpay/reset-complete`) and the environment does not rebuild it by itself. Check: `select count(*) from menu_router where path like 'cgpay/%'` is greater than 0, and `POST /cgpay/whoami` answers 401.
6. Check: sign in through the app, then confirm the database shows connections from `<env>_cgpay`. A write to any table other than an allowlisted one must be refused.
7. Remove the old read-only user once nothing uses it.

## The database user

Run as a database admin, once per environment:

```
CREATE USER '<env>_cgpay'@'localhost' IDENTIFIED BY '<password>';
GRANT SELECT ON <env>.* TO '<env>_cgpay'@'localhost';
GRANT INSERT, UPDATE, DELETE ON <env>.reset_codes TO '<env>_cgpay'@'localhost';
```

Every new allowlisted table needs its own grant line and a migration.

## Developer machines

Create the same user in your local database (the one `web/.env` points at):

```
CREATE USER 'test_cgpay'@'%' IDENTIFIED BY 'testpw';
GRANT SELECT ON test.* TO 'test_cgpay'@'%';
GRANT INSERT, UPDATE, DELETE ON test.reset_codes TO 'test_cgpay'@'%';
```

Run the cgmembers-frame migrations locally first so `reset_codes` exists. `web/tests/README.md` says which tests need it.

## Before real text messages go out

- Confirm the SMS provider's registration for application-to-person messaging covers password-reset codes.
- Confirm what happens when a member replies STOP, and that the app falls back to email.
- Set a spend alert with the provider.
