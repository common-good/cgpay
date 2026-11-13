#!/bin/bash
set -euo pipefail
source /etc/cert-monitor/credentials.sh

THRESHOLD_DAYS=20
ALERT_TO="info@commongood.earth"
ALERT_FROM="alerts@commongood.earth"

OUTPUT=$(certbot certificates 2>&1)
DAYS=$(echo "$OUTPUT" | grep -oP 'VALID: \K[0-9]+(?= days?)' | head -1)

if [ -z "$DAYS" ]; then
  # couldn't parse an expiry at all - alert regardless, since that's its own
  # sign something's wrong with certbot itself, not just the cert
  DAYS=0
fi

if [ "$DAYS" -lt "$THRESHOLD_DAYS" ]; then
  # Built with jq, not manual string interpolation - certbot's output is
  # multi-line, and raw newlines embedded directly into a hand-built JSON
  # string produce invalid JSON. Confirmed the hard way: Postmark rejected
  # the first version with "Invalid request field(s): Request.TextBody".
  PAYLOAD=$(jq -n \
    --arg from "$ALERT_FROM" \
    --arg to "$ALERT_TO" \
    --arg subject "URGENT! SSL cert expiring in ${DAYS} days - commongood.earth" \
    --arg body "certbot certificates on members VPS reports:

${OUTPUT}

Investigate the renewal cron job and name.com API credentials if this wasn't expected." \
    '{From: $from, To: $to, Subject: $subject, TextBody: $body}')

  curl -s "https://api.postmarkapp.com/email" \
    -X POST \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "X-Postmark-Server-Token: ${POSTMARK_TOKEN}" \
    -d "$PAYLOAD" > /dev/null
fi
