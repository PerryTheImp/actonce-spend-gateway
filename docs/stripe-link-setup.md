# Stripe Link Setup Guide

The ActOnce Spend Gateway handles decisions. Stripe Link CLI handles payments. This guide wires the two together.

---

## What the Gateway Does vs What Stripe Does

| Step | Who Handles It |
|------|----------------|
| Agent decides to spend | Agent |
| Check if spend is allowed | **ActOnce Gateway** |
| Actually move money | **Stripe Link CLI** |
| Record payment outcome | **ActOnce Gateway** (via `log_spend_result`) |

The gateway never sees your Stripe credentials, card numbers, or payment tokens. It only says yes, no, or wait.

---

## Prerequisites

- Stripe account with Link enabled
- Stripe CLI installed: `stripe --version`
- Stripe Link CLI installed: `stripe-link --version` (or however you invoke Stripe Link)
- ActOnce Spend Gateway installed and initialised

---

## Step 1: Log In to Stripe CLI

```bash
stripe login
```

This opens a browser window to authenticate your CLI session. Complete the auth flow.

Verify:

```bash
stripe account
```

---

## Step 2: Verify Stripe Link Is Available

Stripe Link is the fast-checkout flow that lets you pay without re-entering card details. Confirm your account has Link enabled in your [Stripe Dashboard](https://dashboard.stripe.com/settings/link).

---

## Step 3: Test a Manual Stripe Link Payment

Before involving the gateway, make sure Stripe Link CLI works on its own:

```bash
stripe link pay \
  --amount 100 \
  --currency usd \
  --description "Test payment"
```

Follow the prompts. If the payment succeeds, you are ready to wire in the gateway.

---

## Step 4: Add Stripe Link to Your Agent Workflow

Your agent now has a two-step spend process:

### Step 4a: Ask the Gateway for Permission

```bash
actonce-spend check \
  --amount 14.99 \
  --currency USD \
  --merchant namecheap.com \
  --reason "Domain for client project"
```

Capture the `transaction_reference` from the response. You need it later.

**If the decision is `approved`:** proceed to payment.

**If the decision is `requires_approval`:** pause. Alert the human. Wait for `actonce-spend approve <txn_ref>`.

**If the decision is `rejected`:** stop. The log entry tells you why.

### Step 4b: Execute the Payment

Once approved, call Stripe Link CLI:

```bash
stripe link pay \
  --amount 1499 \
  --currency usd \
  --description "Domain for client project" \
  --metadata actonce_txn=actonce_txn_abc123
```

**Note:** Stripe Link CLI amounts are in the smallest currency unit (cents for USD). $14.99 becomes `1499`.

The `--metadata` tag links the Stripe payment back to the gateway transaction reference. This is optional but recommended.

### Step 4c: Log the Result

After payment succeeds or fails, close the loop with the gateway:

```bash
actonce-spend log-result \
  --transaction-reference actonce_txn_abc123 \
  --status completed \
  --payment-method stripe_link_cli \
  --receipt-url "https://dashboard.stripe.com/payments/pi_xxx"
```

Or via MCP `log_spend_result` if your agent is calling directly.

---

## Step 5: Automate the Flow in Your Agent

Here is a pseudocode snippet for your agent logic:

```
function spend(amount, currency, merchant, reason):
  # 1. Check with gateway
  decision = gateway.check_spend(amount, currency, merchant, reason)

  if decision.status == "rejected":
    return { ok: false, error: decision.reason }

  if decision.status == "requires_approval":
    notify_human(decision.transaction_reference, amount, merchant)
    return { ok: false, error: "Awaiting human approval", queue: decision.transaction_reference }

  # 2. Gateway approved — proceed to payment
  stripe_amount = convert_to_minor_units(amount, currency)
  payment = stripe_link.pay(
    amount: stripe_amount,
    currency: currency,
    description: reason,
    metadata: { actonce_txn: decision.transaction_reference }
  )

  # 3. Log the outcome
  gateway.log_spend_result(
    transaction_reference: decision.transaction_reference,
    status: payment.ok ? "completed" : "failed",
    payment_method: "stripe_link_cli",
    receipt_url: payment.receipt_url,
    notes: payment.error
  )

  return { ok: payment.ok, receipt: payment.receipt_url }
```

---

## Important Notes

- The gateway never calls Stripe. Your agent (or script) calls both the gateway and Stripe separately.
- Keep the gateway transaction reference. It is the audit trail that ties the decision to the payment.
- If a payment fails after gateway approval, log it as `failed`. The gateway tracks outcomes, not just approvals.
- Stripe Link CLI may prompt for device auth or 3D Secure depending on your account. Your agent should handle timeouts and retries gracefully.

---

## Troubleshooting

**Stripe Link CLI not installed**
- Install via Stripe CLI plugins: `stripe plugins install link` (or follow current Stripe docs — plugin names change)

**Gateway approved but Stripe payment failed**
- This is expected. The gateway checks policy, not your card balance. Log the failure and retry or escalate.

**Currency mismatch**
- The gateway accepts `"GBP"` or `"USD"`. Stripe Link CLI may need `--currency usd` (lowercase). Match them carefully.

**Amount off by 100x**
- Stripe uses minor units. The gateway uses decimal amounts. Convert before calling Stripe.

---

That is it. Gateway for decisions. Stripe for money. Two tools, one clean workflow.
