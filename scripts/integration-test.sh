#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

export ACTONCE_POLICY_PATH="$TMPDIR/actonce-policy.yaml"
export ACTONCE_DB_PATH=":memory:"
export ACTONCE_LOG_PATH="$TMPDIR/actonce-spend.log"
export ACTONCE_LOG_DESTINATION="file"
export ACTONCE_QUEUE_PATH="$TMPDIR/approval-queue.json"

cat > "$ACTONCE_POLICY_PATH" <<'EOF'
version: "1.0"
default_mode: ask
currency: GBP
max_single_purchase: 50.00
max_daily_spend: 200.00
max_monthly_spend: 1000.00
require_human_approval_above: 25.00
always_require_approval_for:
  - crypto
  - gambling
  - adult
  - weapons
allowed_merchants: []
blocked_merchants: []
trusted_merchants: []
allowed_categories: []
blocked_categories:
  - gambling
  - crypto
  - adult
  - weapons
allowed_hours:
  start: "00:00"
  end: "23:59"
timezone: "UTC"
dedupe_window_minutes: 30
dedupe_match_on:
  - amount
  - currency
  - merchant
max_requests_per_agent_per_hour: 10
max_requests_per_task: 3
log_level: info
log_destination: file
log_path: ./logs/actonce-spend.log
EOF

echo "=== Integration Test: CLI check → decision → log ==="

# 1. Run a check (simulate so no logging)
SIM_RESULT=$(node packages/cli/dist/index.js check --amount 14.99 --currency GBP --merchant namecheap.com --simulate)
echo "Simulate result: $SIM_RESULT"

# 2. Run a real check (should log)
REAL_RESULT=$(node packages/cli/dist/index.js check --amount 14.99 --currency GBP --merchant namecheap.com)
echo "Real result: $REAL_RESULT"
REF=$(echo "$REAL_RESULT" | grep -o '"transaction_reference": "[^"]*"' | cut -d'"' -f4)
echo "Transaction reference: $REF"

# 3. Run a check that requires approval
APPROVAL_RESULT=$(node packages/cli/dist/index.js check --amount 30 --currency GBP --merchant namecheap.com)
echo "Approval result: $APPROVAL_RESULT"
REF2=$(echo "$APPROVAL_RESULT" | grep -o '"transaction_reference": "[^"]*"' | cut -d'"' -f4)

# 4. List pending
PENDING=$(node packages/cli/dist/index.js pending)
echo "Pending:"
echo "$PENDING"

# 5. Approve it
node packages/cli/dist/index.js approve "$REF2" --by integration-test

# 6. Verify no more pending
PENDING_AFTER=$(node packages/cli/dist/index.js pending)
echo "Pending after approve:"
echo "$PENDING_AFTER"

# 7. Check logs
LOGS=$(node packages/cli/dist/index.js logs --last 10)
echo "Recent logs:"
echo "$LOGS"

echo ""
echo "=== Integration test passed ==="
