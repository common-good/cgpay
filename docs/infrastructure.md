# Infrastructure overview

Servers, sites, and how the pieces fit. Written for both humans and Claude, so it is tables and short facts. Source: "Runbook - Production and Standby VPS setup" (full build steps, commands, and gotchas live there, not here). Items marked [why] link to the reasoning in the appendix. No secrets here; the "Secrets" section says where they live.

## Servers

| Server | Role | OS / stack | Reached at |
|---|---|---|---|
| **members VPS** (`members1`) | Production primary. Runs `main` + `beta` | Ubuntu 24.04, nginx, PHP 8.2-FPM, MariaDB, Node 20.20.2 via nvm, pm2 | `members1.commongood.earth` |
| **standby VPS** (`members2`) | Hot standby, promotable. Full app stack identical to members; web blocked until promoted | same as members | `members2.commongood.earth` |
| **test** (hostname `new2`) | Testing server: envs `test`, `dev`, `staging`, `demo` (each cg + pay) | CentOS/RHEL-style (nginx runs as user `nginx`) | `new2.commongood.earth` |
| **promo** | Marketing sites: `www.commongood.earth`, `cg4.us`, `commongoodbank.com` | not covered here | `commongood.earth` |
| old VPS (`new`) | Being retired; its crontabs and nginx config were the model for members | CentOS | - |

SSH: port **7822** everywhere; key auth (password fallback still on until the planned hardening pass). Admin accounts: `wspademan`, `cschwab`, `egwynn` (sudo, same on both members boxes).

## DNS: identity vs role [why](#why-dns)

| Name | Type | Points at | Browse to it? |
|---|---|---|---|
| `members1`, `members2` | A | the two physical boxes, permanently | no (infra) |
| `members` | CNAME | whichever box is primary | no |
| `standby` | CNAME | whichever box is standby | no |
| `main`, `beta` | CNAME | `members` | **yes** (cg) |
| `pay.main`, `pay.beta` | CNAME | `main`, `beta` | **yes** (pay) |

A promotion flips only `members` and `standby`; everything else follows. SSH aliases `members`/`standby` in William's `~/.ssh/config` point at `members1`/`members2` directly and do not follow promotions. Each `pay.<env>` and `<env>` needs explicit records (a wildcard does not cover them).

## Environments on members and standby

Same on both boxes (standby is built identically, then gated).

| | `main` | `beta` |
|---|---|---|
| Purpose | production | staff-only view of production data, independent code/deploys [why](#why-beta) |
| cg URL | `main.commongood.earth` | `beta.commongood.earth` |
| pay URL | `pay.main.commongood.earth` (port **3001**) | `pay.beta.commongood.earth` (port **3002**) |
| Linux user | `main` | `beta` |
| PHP-FPM socket | `/run/php/php8.2-fpm-main.sock` | `...-beta.sock` |
| Database / DB users | `main` / `main`, `main_ro` | same DB and users (no DB of its own) |
| Cookie scope | `.main.commongood.earth` | `.beta.commongood.earth` [why](#why-cookies) |

Other names accepted by `main.conf`: `members`, `standby`, `members1`, `members2` (for curl/cron/ssh, not for logging in). `rc2.me` (`<region>.rc2.me/<code>`) redirects to `pay.main.commongood.earth/?region=&code=`.

## Databases and DB users

Naming rule: **Linux user = DB name = DB user = `<env>`**; the read-only user (used by cgpay) is `<env>_ro`. All users are `@localhost` except `repl`.

| Where | DB | User | Rights | Used by | Password stored in |
|---|---|---|---|---|---|
| members, standby | `main` | `main` | ALL on `main.*` | cg, for `main` and `beta` | `/home/main/cg/shared/config/config.json` (`.db.pass`) and `phinx.json` (`.environments.main.pass`) |
| members, standby | `main` | `main_ro` | SELECT on `main.*` | cgpay, for `main` and `beta` | `/home/{main,beta}/pay/shared/web/.env` (`DB_PASSWORD=`) |
| members -> standby | n/a | `repl` (`%`) | REPLICATION SLAVE | replication | standby's replication config |
| standby only | `main` | `backup` | SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER | mysqldump cron | `/etc/mysql-backup/credentials.sh` |
| test | `test`, `dev`, `staging`, `demo` | `<env>`, `<env>_ro` (e.g. `test_ro`) | same as main / main_ro | cg / cgpay of that env | same file layout under `/home/<env>/` (confirm paths) |
| all | n/a | `root` | unix_socket | admin | no password: `sudo mysql -u root` |

- `beta` has no DB or DB user of its own; its config files are symlinks to `main`'s (cg) or copies of `main`'s credentials (pay `.env`).
- **Rotating a password:** `ALTER USER` runs on members only and replicates. Files do not replicate, so rewrite them on both boxes: `config.json` and `phinx.json` for `main`; both pay `.env` files for `main_ro`. (`.env` is also copied by `lsyncd` after about 2 s.) Phinx runs on the server, from the server's `phinx.json`, so it must match.
- **Restarting cgpay after an `.env` change:** `sudo -iu <env> bash -c 'source ~/.nvm/nvm.sh && pm2 restart pay --update-env'`, for `main` and `beta`, on both boxes. pm2 process name is `pay`.
- Existing scripts on members: `dbpw2` (the `main` user: DB + `config.json` + `phinx.json`, both boxes), `ropw2` (`main_ro`: DB + both `.env` + restart pay x4).

## Layout on a box

- App dirs (Capistrano): `/home/<env>/cg/{releases,current,shared}` and `/home/<env>/pay/{releases,current,shared/web}`. Home dirs are mode 750.
- **`beta` symlinks into `main`'s `shared/`**: `config/`, `vendor/` (read-only use) and `cgLogs/`, `cgPhotoTemp/`, `msgs/` (writable via POSIX ACLs). `beta/cg/shared` is otherwise empty. ACL on `/home/main` lets `beta` traverse; `www-data` is in both users' groups so nginx can serve static assets.
- `config.json` has DB creds and `cgpaySsoSecret`; `baseUrl` is deliberately `""` (cg derives it from the request Host); `stage` is `"main"` for both main and beta.
- pay config: `/home/<env>/pay/shared/web/.env` (PORT, DB_*, JWT_SECRET, PHP_SSO_URL, PHP_SSO_SECRET, PHP_COOKIE_DOMAIN, PUBLIC_PHP_BASE_URL). Real separate file per env.
- nginx: `/etc/nginx/sites-available/{main,pay.main,beta,pay.beta,rc2}.conf`, symlinked into `sites-enabled`. Standby copies differ only in cert path.
- Node: nvm per user (`main`, `beta`), v20.20.2, plus global `pm2`.

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

`main`'s crontab (identical on both boxes, via `standby-guard`): `cron.php` every 5 min, `bounces.php` hourly, `app-socket.php` every 5 min (flock). Never in `beta`'s crontab. Promotion = remove both markers, `SET GLOBAL read_only=0`, stop replication, flip DNS; see "Runbook - Promotion checklist".

## Certificates

One Let's Encrypt cert `commongood.earth`: apex plus `*.commongood.earth` and `*.test|dev|staging|demo|main|beta.commongood.earth` (wildcards cover one label only). DNS-01 via name.com API hooks in `/etc/letsencrypt/namecom/`; `certbot renew` cron twice daily on members, deploy hook distributes. Paths: members uses `/etc/letsencrypt/live/commongood.earth/`; every other server uses `/etc/letsencrypt-synced/`. Daily expiry check emails `info@` via Postmark if under 20 days. `cg4.us` and `commongoodbank.com` on promo have their own certbot certs.

## Deploys

- Capistrano from a dev machine, in each repo root: `cap2 main` / `cap2 beta` (Windows: PowerShell function in `$PROFILE`; macOS/Linux: `./cap2.sh`). Each runs `cap <stage> deploy` then `cap <stage>-standby deploy`.
- Stages: `main`, `beta`, `main-standby`, `beta-standby`; test server has `test`, `dev`, `staging`, `demo`.
- `phinx migrate` runs only under `main`, never `beta`. Repos are public; deploys clone over https.
- pm2 for pay must run from `current_path`, not a release dir; a stale pinned process needs `pm2 delete pay` once.

## Operations

| Script (on members) | Does |
|---|---|
| `userpw2 <env> <pw>` | Linux password for main/beta on both boxes |
| `dbpw2 <pw>` | `main` DB password + `config.json` + `phinx.json` on both |
| `ropw2 <pw>` | `main_ro` password, both `.env` files, restart pay x4 |

Backups: standby only, `mysqldump` of `main` via account `backup`, daily/weekly/monthly (7 / 35 / 366 days) in `/var/backups/mysql/`; failures email `tech@` via Postmark (`cronic-on-error`). Keep MariaDB and Node versions identical on the two boxes; patch standby first.

## Secrets (where, not what)

name.com token and Postmark tokens: root-only files under `/etc/letsencrypt/namecom/`, `/etc/cert-monitor/`, `/etc/mysql-backup/`. DB passwords: config files above and William's password manager. Root MariaDB uses `unix_socket` (sudo, no password).

## test server and promo (thin)

- **test** (`new2`): 8 nginx server blocks, still on the old manually-bought cert path; hostnames `pay-<env>` are slated to become `pay.<env>` with per-env cookie domains. Details: "Runbook - CG server environments setup". `demo` is public-facing and deliberately skips real verification, transfers, and staff alerts via `stage`.
- **promo**: only `www.commongood.earth` uses the wildcard cert; nothing synced from members except the cert.

## Open items

- How cg sets its session cookie `Domain` (if from `config.json`, beta's shared file breaks per-env scoping).
- `rc2.me` DNS target unconfirmed.
- cgpay's CLAUDE.md mentions a `cgweb_ro` user "in some environments"; the runbook only has `main_ro` / `<env>_ro`. Reconcile.
- Test server: confirm `.env`, config and pm2 paths match the members layout.
- Hardening (ufw, fail2ban, disable root/password ssh, scope MariaDB bind-address) still to do across all servers.
- Test-server runbook and certs not yet reconciled with this one.

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