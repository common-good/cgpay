# Infrastructure overview

Servers, sites, and how the pieces fit. Written for both humans and Claude, so it is tables and short facts. Source: "Runbook - Production and Standby VPS setup" (PROD runbook: full build steps, commands, gotchas) and a read-only look at the live test server on 2026-11-05. Items marked [why] link to the reasoning in the appendix. No secrets here; the "Secrets" section says where they live.

**How to read this doc.** Each section says what is true **now**. Where we mean to change it within about a month (by early December 2026), a line starting **Target:** says what it will be. The table below lists every gap in one place. When a gap closes, delete its Target line and its row.

## Gaps between now and the target (about a month)

| # | Now | Target |
|---|---|---|
| 1 | Production is the old server `new`; members and standby are being built | members is production, standby is hot standby, `new` retired |
| 2 | cgpay uses read-only DB user `<env>_ro` | `<env>_cgpay` (SELECT everywhere, writes only on allowlisted tables, first `reset_codes`) |
| 3 | `cgpaypw2` (replaces `ropw2`) is installed on members and rotates `main_ro`; it restarts `pay-main` / `pay-beta`, which exist only after the first deploy of the fixed `deploy.rb` (members still runs two processes named `pay`; `pm2 delete pay` once per user then) | same script rotates `main_cgpay` when that user exists |
| 4 | pay sets its session cookie on `.commongood.earth` for every env (the code derives the last two labels of the PHP host and ignores `PHP_COOKIE_DOMAIN`) | the PHP host itself (`.test.commongood.earth`, `.main...`): cgpay PR #209, not yet merged or deployed |
| 5 | `bounces.php` removed 2026-11-06 from the members and standby crontab and nginx, and from the PROD runbook; the file is deleted in cgmembers-frame PR #98 (not yet merged) | merged, deployed everywhere (Postmark tracks bounces; member support checks it) |
| 6 | `copy_admin_keys` in cg `deploy.rb` fails the `test` deploy if `shared/misc` is missing (fix: cgmembers-frame PR #99, not yet merged) | runs only on `test` and only if `shared/misc` exists |
| 7 | Redirects done 2026-11-06 (test server rc2 and rc4, members and standby rc2). DNS not yet changed: `<region>.rc2.me` and `www.rc2.me` still point at the test server | `*.rc2.me` DNS to members; `*.rc4.me` stays on the test server |
| 8 | Done 2026-11-07: test server homes 750 + ACL for `nginx`, secrets 600; members and standby pay `.env` files are 600, owned by their env user. lsyncd writes the standby copy as user `lsyncd`, so standby has a systemd path unit (`fix-pay-env.path`, script `/usr/local/bin/fix-pay-env`) that re-owns the synced files to `main`/`beta` mode 600 within a second; promotion needs no extra step. `config.json` is 600 with an ACL for beta | none |
| 9 | Test server leftovers removed 2026-11-06: the `cgpay-poc` process, systemd unit, nginx conf, logs and `/home/cschwab/cgpay` (Chris approved; his one stash is saved as `docs/cschwab-poc-stash-2026-11-06.patch`); the DB users `new_cg`, `new_user`, `new_demo` and the databases `new_cg`, `new_demo`; the account `new` (including a 32 GB 2024 backup zip), its PHP pools and the `new`, `cgpay-*`, `app1`, `ws` nginx confs (archived in `/root/nginx-old-confs-nov6.tgz`); `/home/new-demo`; the accounts `fuzzy`, `jridgway`, `scooley`; the per-env GitHub deploy keys (server and GitHub) | none |
| 10 | `staging` and `demo` have no running pay process | running once the SvelteKit work merges to main |
| 11 | Test server MariaDB upgraded 2026-11-07 from 10.6.23 to 10.11.19 (MariaDB.org repo `deb.mariadb.org/10.11/ubuntu`), same series as members; pre-upgrade dump of all DBs in `/root/all-dbs-pre-10.11-nov7.sql.gz` on the test server. Local dev machines run 11.2.2 | none (keep 10.11 on all three servers) |
| 12 | Hardened 2026-11-07 on all three servers: `/etc/ssh/sshd_config.d/00-hardening.conf` (no password login, no root login, no X11, MaxAuthTries 3), ufw (deny incoming; allow 7822, 80, 443; members and standby also allow 3306 from each other), fail2ban `sshd` jail on port 7822 (1 h ban after 5 failures in 10 min; our three server IPs ignored). Not done: promo and `new` | promo and `new` (new retires at cutover) |
| 13 | New cg routes need a manual `/sadmin/util/reset-menu` after deploy (done on test and dev; staging and demo still lack the `/cgpay/*` routes) | cg deploy rebuilds the menu automatically |
| 14 | Dead `.env` params (`JWT_SECRET`, `PHP_SSO_URL`, `PHP_COOKIE_DOMAIN`) removed 2026-11-06 from every pay `.env` (test, dev, staging, demo, main, beta). `main` and `beta` have a build (58c162dc) that still reads them, but nothing runs there yet; deploy `develop` before starting `pay-main` or `pay-beta` | done once `develop` is deployed to main and beta |
| 15 | Turnstile (captcha on /signup, cgpay #203 and cgmembers #86): test envs have Cloudflare's always-pass test keys; `main` and `beta` have the placeholder "add real Cloudflare key here" in pay `.env` (`PUBLIC_TURNSTILE_SITEKEY`) and cg `config.json` (`turnstileSitekey`, `turnstileSecret`) on members and standby | real sitekey and secret from the Cloudflare dashboard in both places |
| 16 | `staging` and `demo` pay `.env` lack `PORT` (3003, 3004) and `PHP_SSO_COOKIE_NAME`; `CGPAY_PWA_URL` is unset in every env | set when those envs are brought up; `CGPAY_PWA_URL` stays unset until the legacy app is ported |
| 17 | The runbooks were out of step with the repos and this doc | updated 2026-11-06 (ENV runbook rewritten, PROD renames); conflict list `~/docs/runbooks/conflicts-2026-11-05.md` |

## Servers

| Server | Role | OS / stack | Reached at |
|---|---|---|---|
| **members VPS** (`members1`, 65.181.122.201) | Production primary (target). Runs `main` + `beta` | Ubuntu 24.04, nginx, PHP 8.2-FPM, MariaDB, Node 20.20.2 via nvm, pm2 | `members1.commongood.earth` |
| **standby VPS** (`members2`) | Hot standby, promotable. Full app stack identical to members; web blocked until promoted | same as members | `members2.commongood.earth` |
| **test server** (103.72.79.209, hostname `test`; formerly `new1` / `new2`: one VPS) | Envs `test`, `dev`, `staging`, `demo` (each cg + pay) | Ubuntu 22.04.5, nginx (runs as user `nginx`), PHP 8.2.35-FPM, MariaDB 10.11.19, Node 20 via nvm per env user | `test.commongood.earth` |
| **promo** (65.181.127.6) | Marketing sites: `www.commongood.earth`, `cg4.us`, `commongoodbank.com`; apex `rc2.me`, `rc4.me` | not covered here | `commongood.earth` |
| old server `new` (68.66.205.7) | **Current production** until members takes over; its crontabs and nginx config were the model for members | CentOS | - |

SSH: port **7822** everywhere; key auth only (see gap 12). Admin accounts: `wspademan`, `cschwab`, `egwynn` (sudo).

**Target:** `new` is retired after the promotion.

## DNS: identity vs role [why](#why-dns)

| Name | Type | Points at | Browse to it? |
|---|---|---|---|
| `members1`, `members2` | A | the two physical boxes, permanently | no (infra) |
| `members` | CNAME | whichever box is primary | no |
| `standby` | CNAME | whichever box is standby | no |
| `main`, `beta` | CNAME | `members` | **yes** (cg) |
| `pay.main`, `pay.beta` | CNAME | `main`, `beta` | **yes** (pay) |
| `test`, `dev`, `staging`, `demo` and `pay.<env>` | A or CNAME | test server | **yes** |

A promotion flips only `members` and `standby`; everything else follows. SSH aliases `members`/`standby` in William's `~/.ssh/config` point at `members1`/`members2` directly and do not follow promotions. Each `pay.<env>` and `<env>` needs explicit records (a wildcard does not cover them). The old `pay-<env>` DNS names have been removed.

`rc2.me` / `rc4.me`: apex records point at promo; `<region>.rc2.me`, `<region>.rc4.me` and `www.rc2.me` point at the test server today.
Redirect format (live on the test server for rc2 and rc4, and on members and standby for rc2): `[<region>.]rc2.me/<type><code>` goes to `https://pay.main.commongood.earth/Q=CGCARD-<type><region><code>` (302); rc4 goes to `pay.demo` the same way. **Target:** `*.rc2.me` DNS to members; `*.rc4.me` stays on the test server.

## Environments on members and standby

Same on both boxes (standby is built identically, then gated). **Target** applies to the whole table: it is the plan, not yet live in production.

| | `main` | `beta` |
|---|---|---|
| Purpose | production | staff-only view of production data, independent code/deploys [why](#why-beta) |
| cg URL | `main.commongood.earth` | `beta.commongood.earth` |
| pay URL | `pay.main.commongood.earth` (port **3001**) | `pay.beta.commongood.earth` (port **3002**) |
| Linux user | `main` | `beta` |
| PHP-FPM socket | `/run/php/php8.2-fpm-main.sock` | `...-beta.sock` |
| Database / DB users | `main` / `main`, `main_ro` | same DB and users (no DB of its own) |
| Cookie scope | `.main.commongood.earth` | `.beta.commongood.earth` [why](#why-cookies) |
| pm2 process | `pay-main` | `pay-beta` |

Other names accepted by `main.conf`: `members`, `standby`, `members1`, `members2` (for curl/cron/ssh, not for logging in).

## Databases and DB users

Naming rule: **Linux user = DB name = DB user = `<env>`**; the cgpay user is `<env>_ro` now, `<env>_cgpay` at the target. All users are `@localhost` except `repl`.

| Where | DB | User | Rights | Used by | Password stored in |
|---|---|---|---|---|---|
| members, standby | `main` | `main` | ALL on `main.*` | cg, for `main` and `beta` | `/home/main/cg/shared/config/config.json` (`.db.pass`) and `phinx.json` (`.environments.main.pass`) |
| members, standby | `main` | `main_ro` -> `main_cgpay` | now: SELECT on `main.*`. Target: SELECT on `main.*` plus INSERT/UPDATE/DELETE on allowlisted tables (see `web/src/lib/server/data.ts`; first `reset_codes`) | cgpay, for `main` and `beta` | `/home/{main,beta}/pay/shared/web/.env` (`DB_USER=`, `DB_PASSWORD=`) |
| members -> standby | n/a | `repl` (`%`) | REPLICATION SLAVE | replication | standby's replication config |
| standby only | `main` | `backup` | SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER | mysqldump cron | `/etc/mysql-backup/backup.cnf` (mode 600; `mysqldump --defaults-extra-file`, so the password is not on the command line) |
| test server | `test`, `dev`, `staging`, `demo` | `<env>`, `<env>_ro` (e.g. `test_ro`) -> `<env>_cgpay` | same as main | cg / cgpay of that env | `/home/<env>/cg/shared/config/{config,phinx}.json`, `/home/<env>/pay/shared/web/.env` |
| all | n/a | `root` | unix_socket | admin | no password: `sudo mysql -u root` |

- `beta` has no DB or DB user of its own; its config files are symlinks to `main`'s (cg) or copies of `main`'s credentials (pay `.env`).
- **Rotating a password:** `ALTER USER` runs on members only and replicates. Files do not replicate, so rewrite them on both boxes: `config.json` and `phinx.json` for `main`; both pay `.env` files for the cgpay user. (`.env` is also copied by `lsyncd` after about 2 s.) Phinx runs on the server, from the server's `phinx.json`, so it must match.
- **Restarting cgpay after an `.env` change:** `sudo -iu <env> bash -c 'source ~/.nvm/nvm.sh && pm2 restart pay-<env> --update-env'`, for `main` and `beta`, on both boxes. The pm2 process name is `pay-<env>`, not `pay`.
- Scripts on members: `dbpw2` (the `main` user: DB + `config.json` + `phinx.json`, both boxes), `cgpaypw2` (the cgpay DB user, now `main_ro`: DB + both `.env` + restart `pay-main` and `pay-beta`; installed 2026-11-05).
- `cgpaypw2 <pw>` rotates `main_cgpay` if it exists, else `main_ro`, rewrites `DB_USER` and `DB_PASSWORD` in both `.env` files, and restarts `pay-main` and `pay-beta` on both boxes. CLAUDE.md's mention of a `cgweb_ro` user "in some environments" is unreconciled with these names (open item).

## Layout on a box

- App dirs (Capistrano): `/home/<env>/cg/{releases,current,shared}` and `/home/<env>/pay/{releases,current,shared/web}`. Home dirs are mode 750 on members and standby (755 on the test server now).
- **`beta` symlinks into `main`'s `shared/`**: `config/`, `vendor/` (read-only use) and `cgLogs/`, `cgPhotoTemp/`, `msgs/` (writable via POSIX ACLs). `beta/cg/shared` is otherwise empty. ACL on `/home/main` lets `beta` traverse; `www-data` is in both users' groups so nginx can serve static assets.
- `config.json` has DB creds and `cgpaySsoSecret`; `baseUrl` is deliberately `""` (cg derives it from the request Host), also on the test server; `stage` is `"main"` for both main and beta (standby fixed 2026-11-06; it said `"test"`).
- pay config: `/home/<env>/pay/shared/web/.env` (`PORT`, `DB_*`, `PHP_SSO_SECRET`, `PHP_SSO_COOKIE_NAME`, `PUBLIC_PHP_BASE_URL`, `PUBLIC_TURNSTILE_SITEKEY`, `CGPAY_PWA_URL` (unset), and on local and test only `TEST_ADMIN_BYPASS`; pay will not start if PHP_SSO_COOKIE_NAME is missing; its value is the `SSESS<hash>` cookie cg sets for that host). Real separate file per env. Each `.env` follows the layout and comments of `web/.env.example` and holds only variables the code reads.
- nginx: `/etc/nginx/sites-available/{main,pay.main,beta,pay.beta,rc2}.conf`, symlinked into `sites-enabled`. Standby copies differ only in cert path.
- Node: nvm per user, v20.20.2, plus global `pm2`. Deploy repos are public, cloned over https (no deploy keys).

## Replication and sync (members -> standby, one direction)

| What | How | Notes |
|---|---|---|
| Database | MariaDB binlog replication; standby `read_only=1` | DDL (users, DBs) replicates; never run it on standby too. `server-id` 101 / 102 |
| `main/cg/shared` (except `config/`), `main/pay/shared/web`, `beta/pay/shared/web` (except `node_modules`) | `lsyncd` (rsync over ssh, ~2 s delay) as account `lsyncd` on standby | includes `vendor`, `cgLogs`, `msgs`, `.env` |
| `config.json`, `phinx.json` | not synced; written per box | `dbpw2` updates both |
| nginx configs | copied by hand after verifying on members | `sed` swaps cert path |
| TLS cert | issued on members only, pushed to standby/test/promo by `certsync` | see Certificates |

## Standby guards [why](#why-guards)

| Marker file (on standby only) | Effect |
|---|---|
| `/etc/commongood-standby-web-blocked` | every nginx vhost returns 403. Toggle with `standby-web on [minutes] / off / status` |
| `/etc/commongood-standby` | `standby-guard` makes cg cron jobs no-ops |

`main`'s crontab (identical on both boxes, via `standby-guard`): `cron.php` every 5 min and `app-socket.php` every 5 min (flock). Never in `beta`'s crontab. Promotion = remove both markers, `SET GLOBAL read_only=0`, stop replication, flip DNS; see "Runbook - Promotion checklist".
`bounces.php` is gone from the crontab and nginx (2026-11-06); the repo file goes with cgmembers-frame PR #98. Bounces are tracked in Postmark.

## Certificates

One Let's Encrypt cert `commongood.earth`: apex plus `*.commongood.earth` and `*.test|dev|staging|demo|main|beta.commongood.earth` (wildcards cover one label only); expires 2027-01-31. DNS-01 via name.com API hooks in `/etc/letsencrypt/namecom/`; `certbot renew` cron twice daily on members, deploy hook distributes. Paths: members uses `/etc/letsencrypt/live/commongood.earth/`; every other server uses `/etc/letsencrypt-synced/`. On the test server all eight env blocks (`<env>`, `pay.<env>`) already use the synced cert; the old manually bought cert (`/etc/pki/tls/...`) is only used by `cgpay-dev`, `cgpay-staging`, `cgpay-poc` and `new.conf` (leftovers, see Target below). Daily expiry check emails `info@` via Postmark if under 20 days. `cg4.us` and `commongoodbank.com` on promo have their own certbot certs.

## Deploys

- Capistrano from a dev machine, in each repo root: `cap2 main` / `cap2 beta` (Windows: PowerShell function in `$PROFILE`; macOS/Linux: `./cap2.sh`). Each runs `cap <stage> deploy` then `cap <stage>-standby deploy`.
- Stages: `main`, `beta`, `main-standby`, `beta-standby`; test server has `test`, `dev`, `staging`, `demo`. One `deploy.rb` per repo handles all of them.
- `phinx migrate` runs only under `main`, never `beta`. Repos are public; deploys clone over https.
- pm2 process name is `pay-<stage>`. It must run from `current_path`, not a release dir; a stale pinned process needs `pm2 delete pay-<stage>` once (live now: `dev` on the test server has one).
- **Menu rebuild.** cg keeps its routes in Drupal's `menu_router` table, rebuilt only when `R_VERSION` changes (unchanged since 2019). A deploy that adds or renames a route (the `/cgpay/*` endpoints) is invisible until an admin visits `/sadmin/util/reset-menu` on that env, or pay gets HTML "Page Not Found" from `/cgpay/whoami` and nobody can sign in. Check: `select count(*) from menu_router where path like 'cgpay/%'` is greater than 0. **Target:** a cg deploy step rebuilds the menu, which makes this manual step unnecessary.
- cg `deploy.rb` task `copy_admin_keys` copies `shared/misc` into the release on stage `test` only. **Target:** also skip when `shared/misc` does not exist, so a missing directory no longer aborts the deploy. On `dev`, `staging` and `demo` the keys are copied in by hand once per release when needed, never kept in `shared/`.

## Operations

| Script (on members) | Does |
|---|---|
| `userpw2 <env> <pw>` | Linux password for main/beta on both boxes |
| `dbpw2 <pw>` | `main` DB password + `config.json` + `phinx.json` on both |
| `cgpaypw2 <pw>` | cgpay DB user's password (`main_cgpay` if it exists, else `main_ro`), both `.env` files, restart `pay-main` and `pay-beta` |

Backups: standby only, `mysqldump` of `main` via account `backup`, daily/weekly/monthly (7 / 35 / 366 days) in `/var/backups/mysql/` (mode 700, files 600; `umask 077` in `mysql-backup.sh`); failures email `tech@` via Postmark (`cronic-on-error`). Keep MariaDB and Node versions identical on the two boxes; patch standby first.

## Secrets (where, not what)

name.com token and Postmark tokens: root-only files under `/etc/letsencrypt/namecom/`, `/etc/cert-monitor/`, `/etc/mysql-backup/`. DB passwords: config files above and William's password manager. Root MariaDB uses `unix_socket` (sudo, no password). On the test server these files are now mode 600 and homes 750 (locked down 2026-11-05). On members and standby the pay `.env` files are still mode 664 (world-readable) and need tightening; `beta` reads `main`'s `config/` through an ACL, so a plain `chmod 600` on `config.json` would break beta.

## Test server and promo

Facts as of 2026-11-06:

- 8 nginx server blocks (`<env>`, `pay.<env>` for test/dev/staging/demo) on the synced cert; per env a PHP-FPM pool and Linux user. pay is up on 3001 (test) and 3002 (dev); staging/demo pay not running (3003/3004 closed).
- pay's cookie domain is `.commongood.earth` for every env (derived in code; `PHP_COOKIE_DOMAIN`, `JWT_SECRET` and `PHP_SSO_URL` in `.env` are not read; removed from the `.env` files on 2026-11-06). `baseUrl` is `""`. cg's own cookie scope is still the open item below.
- `demo` is public-facing and deliberately skips real verification, transfers, and staff alerts via `stage`.
- Leftovers: see item 9.
- **Target:** per-env cookie scope (code fix above); homes 750 with an ACL for `nginx`, secret files 600; leftovers removed; rc2/rc4 DNS (see DNS); `staging` and `demo` pay running once SvelteKit merges.
- **promo**: only `www.commongood.earth` uses the wildcard cert; nothing synced from members except the cert.

## Open items

- How cg sets its session cookie `Domain` (if from `config.json`, beta's shared file breaks per-env scoping).
- `coApiUrl` keeps the template placeholder (`http://%website/cgapi/%etc`) on every env; `cgfEmail` and `promoUrl` are real on main and beta (2026-11-06) and still placeholders on the test server.
- Runbook status and remaining differences: `~/docs/runbooks/conflicts-2026-11-05.md`.

---

## Appendix: why

<a id="why-dns"></a>
**DNS identity vs role.** Fixed names for each physical box and CNAME role names mean a promotion is a two-record change and nothing a person browses ever changes. Cookies can't be set on `members.*` for an env-scoped domain, so it isn't a login URL.

<a id="why-beta"></a>
**beta shares main's data.** `beta` exists so staff can try new code against live data, not as a separate environment: no second DB, uploads, or read-only account. Hence symlinked shared dirs, one `config.json`, one set of DB credentials. Its code, pool, port, and pm2 process stay independent so its deploys can't affect main.

<a id="why-cookies"></a>
**Per-environment cookie scope and `pay.<env>` naming.** A cookie `Domain` must be a parent of every host using it. `pay.main.` and `main.` share `.main.commongood.earth`; `pay-main` would have had no parent short of `commongood.earth`, which would share cookies with every environment. main and beta deliberately don't share cookies despite sharing data.

<a id="why-guards"></a>
**Two separate marker files.** "Safe for cron to write" and "safe for the public to browse" are independent switches; one file would let a web toggle accidentally re-arm cron on a read-only replica (duplicate writes).
