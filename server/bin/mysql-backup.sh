#!/bin/bash
# usage: mysql-backup.sh <daily|weekly|monthly> <retention-days>
set -euo pipefail
umask 077
source /etc/mysql-backup/credentials.sh
TIER="$1"
RETENTION_DAYS="$2"
DEST="/var/backups/mysql/${TIER}"
STAMP=$(date +%Y%m%d-%H%M%S)

mysqldump --defaults-extra-file=/etc/mysql-backup/backup.cnf --single-transaction --routines --triggers --events main \
  | gzip > "${DEST}/main-${STAMP}.sql.gz"

find "${DEST}" -name '*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete
