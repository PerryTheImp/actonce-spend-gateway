# Quickstart — ActOnce Spend Gateway

Get the gateway running and approve your first agent spend in five minutes.

---

## Prerequisites

- Node.js 18+ installed
- A terminal
- (Optional) An OpenClaw or MCP-compatible agent if you want to test the integration

---

## Step 1: Install

```bash
npm install -g @actonce/spend-gateway
```

---

## Step 2: Initialise

```bash
actonce-spend init
```

This creates:
- `actonce-policy.yaml` — your policy file
- `logs/` — decision logs directory
- `pending/` — approval queue directory

---

## Step 3: Edit Your Policy

Open `actonce-policy.yaml` and set your basics:

```yaml
version: "1.0"
default_mode: ask
currency: USD

max_single_purchase: 50.00
max_daily_spend: 200.00
require_human_approval_above: 25.00

allowed_merchants:
  - namecheap.com
  - github.com
  - canva.com

allowed_categories:
  - domains
  - software
  - tools

dedupe_window_minutes: 30
```

Save and close.

---

## Step 4: Test a Dry Run

```bash
actonce-spend check \
  --amount 14.99 \
  --currency USD \
  --merchant namecheap.com \
  --reason "Test domain purchase" \
  --simulate
```

You should see:

```
Decision: APPROVED
Policy matched: trusted_merchant_under_limit
Dedupe status: new
Transaction reference: actonce_txn_xxxx
```

The `--simulate` flag means nothing is logged and no queue entries are created. Use it to test your policy safely.

---

## Step 5: Run a Real Check

Remove `--simulate`:

```bash
actonce-spend check \
  --amount 14.99 \
  --currency USD \
  --merchant namecheap.com \
  --reason "Domain for client project"
```

This writes a log entry and returns a real transaction reference.

---

## Step 6: Test an Approval Boundary

Try an amount above your threshold:

```bash
actonce-spend check \
  --amount 149.99 \
  --currency USD \
  --merchant aws.amazon.com \
  --reason "EC2 instance for testing"
```

You should see:

```
Decision: REQUIRES_APPROVAL
Policy reason: Amount exceeds auto-approval limit of 25.00
Transaction reference: actonce_txn_yyyy
```

The request is now in the pending queue.

---

## Step 7: Approve or Reject

View pending requests:

```bash
actonce-spend pending
```

Approve:

```bash
actonce-spend approve actonce_txn_yyyy
```

Or reject:

```bash
actonce-spend reject actonce_txn_yyyy
```

---

## Step 8: View Logs

```bash
actonce-spend logs --last 10
```

Every decision, approval, and rejection is recorded here.

---

## Next Steps

- [Connect to OpenClaw](openclaw-setup.md) — let your agent call the gateway directly
- [Connect Stripe Link](stripe-link-setup.md) — wire up actual payments
- [Read the full policy reference](policy-reference.md) — learn every field and rule

---

Troubleshooting tip: if `actonce-spend` is not found after global install, check your npm global bin directory is on your PATH. Run `npm bin -g` to see where it lives.
