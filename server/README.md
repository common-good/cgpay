# server/

Files installed on the production pair (members = main + beta, and standby) by the
runbook "Production and Standby VPS setup". The runbook says where each one goes
and which server it belongs on; the files themselves live here so they are versioned
with the app. The test-server environments use `config/deploy.rb` and the ENV runbook.

Install with `sudo install -m MODE -o root -g root server/<path> <destination>`.

| File | Destination | Mode | Server |
|---|---|---|---|
| `bin/userpw2`, `bin/dbpw2`, `bin/cgpaypw2` | `/usr/local/bin/` | 755 | members, standby (password rotation) |
| `bin/standby-guard` | `/usr/local/bin/` | 755 | members, standby (wraps cron jobs so they do not run on standby) |
| `bin/standby-web` | `/usr/local/bin/` | 755 | standby (opens or closes the web gate) |
| `bin/cronic-on-error`, `bin/mysql-backup.sh` | `/usr/local/bin/` | 755, 700 | standby (backups; needs `/etc/mysql-backup/{credentials.sh,backup.cnf}`) |
| `bin/check-cert-expiry.sh` | `/usr/local/bin/` | 700 | members (needs `/etc/cert-monitor/credentials.sh`) |
| `bin/fix-pay-env`, `systemd/fix-pay-env.{service,path}` | `/usr/local/bin/`, `/etc/systemd/system/` | 755, 644 | standby (re-owns the synced pay `.env` files) |
| `bin/verify-setup` | run in place: `bash server/bin/verify-setup <role> [domain]` (role: members, standby or test) | - | any (read-only checks, PASS/FAIL per line) |
| `ssh/00-hardening.conf` | `/etc/ssh/sshd_config.d/` | 644 | all (key-only SSH; the 00- name must sort before cloud-init's 50-) |
| `fail2ban/jail.local` | `/etc/fail2ban/` | 644 | all (edit `ignoreip` to your own server IPs first) |
| `lsyncd/lsyncd.conf.lua` | `/etc/lsyncd/` | 644 | members |
| `nginx/{main,pay.main,beta,pay.beta,rc2}.conf` | `/etc/nginx/sites-available/` | 644 | members as is; standby with the cert path rewritten (below) |

Standby nginx confs differ only in the TLS cert path:

    sed -e 's|/etc/letsencrypt/live/commongood\.earth/|/etc/letsencrypt-synced/|g' nginx/main.conf

The scripts and confs mirror what runs on members and standby. If you change a file on a
server, change it here too (and the other way around).
