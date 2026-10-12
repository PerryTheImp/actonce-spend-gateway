# OpenClaw Setup Guide

Connect the ActOnce Spend Gateway MCP server to OpenClaw so your agents can request spends directly.

---

## What You Need

- OpenClaw installed and running
- The ActOnce Spend Gateway installed globally (`npm install -g @actonce/spend-gateway`)
- A policy file ready (run `actonce-spend init` if you have not already)

---

## Step 1: Add the MCP Server to OpenClaw

Open your OpenClaw configuration file. This is usually at `~/.openclaw/config.json` or wherever your OpenClaw setup stores its MCP server list.

Add this block to your `mcpServers` object:

```json
{
  "mcpServers": {
    "actonce-spend": {
      "command": "npx",
      "args": ["-y", "@actonce/spend-gateway@latest", "start", "--mcp"],
      "env": {
        "ACTONCE_POLICY_PATH": "/full/path/to/your/actonce-policy.yaml",
        "ACTONCE_LOG_PATH": "/full/path/to/your/logs/actonce-spend.log"
      }
    }
  }
}
```

**Important:** Use absolute paths for the policy and log paths. The MCP server runs in its own context and relative paths often resolve to the wrong directory.

---

## Step 2: Restart OpenClaw

After saving the config, restart the OpenClaw gateway so it picks up the new MCP server:

```bash
openclaw gateway restart
```

---

## Step 3: Verify the Tools Are Available

In OpenClaw, run a quick check to confirm the tools are registered:

```
What tools does the actonce-spend MCP server expose?
```

You should see:

- `check_spend` — evaluate a spend request
- `log_spend_result` — record the outcome after payment
- `preview_policy` — show the agent a read-only summary of current policy limits

---

## Step 4: Test from OpenClaw

Ask your agent to run a dry-run spend check:

```
Use the actonce-spend tool to simulate a check_spend for $14.99 at namecheap.com for a domain purchase.
```

The agent should call `check_spend` with `--simulate` (or the agent can pass `"simulate": true` in the arguments if supported).

You should see a decision response like:

```json
{
  "decision": "approved",
  "transaction_reference": "actonce_txn_abc123",
  "policy_matched": "trusted_merchant_under_limit",
  "approval_required": false
}
```

---

## Step 5: Let the Agent Spend for Real

Once you trust the setup, remove the simulation flag. A real `check_spend` call:

1. Evaluates the request against your policy
2. Checks for duplicates
3. Logs the decision
4. Returns `approved`, `rejected`, or `requires_approval`

If approved, your agent can then proceed to call Stripe Link CLI (or whatever payment method you use) to complete the purchase. After payment succeeds or fails, the agent should call `log_spend_result` to close the loop.

---

## Example Agent Workflow

Here is what a complete spend flow looks like from OpenClaw:

```
Agent: I need to buy a domain for $14.99 at namecheap.com.
  → Calls check_spend
  ← Gateway returns APPROVED with transaction_reference: actonce_txn_001

Agent: Proceeding with Stripe Link payment...
  → Agent calls stripe link pay --amount 14.99 --merchant namecheap.com
  ← Payment succeeds

Agent: Recording result...
  → Calls log_spend_result with status: completed
  ← Gateway updates log
```

If the gateway returns `REQUIRES_APPROVAL`, the agent should pause and inform you. You then run `actonce-spend approve actonce_txn_001` from your terminal, or approve via Telegram/Slack if configured.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ACTONCE_POLICY_PATH` | Yes | Absolute path to your policy YAML file |
| `ACTONCE_LOG_PATH` | No | Where to write decision logs. Defaults to `./logs/actonce-spend.log` |
| `ACTONCE_DB_PATH` | No | Path to SQLite dedupe store. Defaults to `:memory:` |
| `ACTONCE_QUEUE_PATH` | No | Path to approval queue JSON. Defaults to `./data/approval-queue.json` |
| `ACTONCE_TELEGRAM_BOT_TOKEN` | No | For approval alerts. Free version supports one user / one channel |
| `ACTONCE_TELEGRAM_CHAT_ID` | No | Target chat for Telegram alerts |

---

## Troubleshooting

**MCP server not appearing in tool list**
- Check the OpenClaw gateway logs: `openclaw gateway status` then view logs
- Verify the `npx` command works in your shell: `npx -y @actonce/spend-gateway@latest --help`
- Ensure paths in `env` are absolute

**Policy changes not taking effect**
- The gateway loads the policy at startup. Restart the MCP server by restarting the OpenClaw gateway

**Approval queue not visible**
- The queue is file-based and lives in the `pending/` directory next to your policy file. Check there directly if the CLI command fails

---

Done. Your OpenClaw agents now have spending guardrails.
