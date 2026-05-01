# Give AI Agents Spending Power Without Losing Control

[![CI](https://github.com/PerryTheImp/actonce-spend-gateway/actions/workflows/main.yml/badge.svg)](https://github.com/PerryTheImp/actonce-spend-gateway/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**TL;DR:** ActOnce Spend Gateway is an open-source decision layer that sits between your AI agents and payment flows. It checks every spend request against a local policy file, blocks duplicates, and routes high-risk purchases to human approval. The gateway never touches payment credentials — it only says yes, no, or "wait for approval." Install it locally, define your rules in YAML, and let your agents spend within guardrails.

---

Stripe gave agents a way to pay. ActOnce gives them a way to be trusted.

This is a lightweight, local-first spending control layer for AI agents. Before any money moves, the gateway asks one question: *should this agent be allowed to spend this amount with this merchant right now?*

- **Policy-driven, not prompt-driven.** Rules live in a YAML file. Agents cannot talk their way around them.
- **Local-first.** No cloud, no API keys, no data leaving your machine unless you want it to.
- **Zero payment exposure.** The gateway never sees cards, tokens, or Stripe credentials. It handles decisions. Stripe handles payments.

---

## Quick Install

```bash
npm install -g @actonce/spend-gateway
actonce-spend init
```

Edit `actonce-policy.yaml` to set your limits. Then start the MCP server:

```bash
actonce-spend start --mcp
```

---

## What It Does in 30 Seconds

1. Your agent sends a spend intent (`check_spend`)
2. The gateway evaluates it against your local policy
3. Returns `approved`, `rejected`, or `requires_approval`
4. Logs every decision with timestamp, reason, and context

---

## Use Cases

### Domain Buying
Your SEO agent needs to register client domains on demand. Policy: allow up to £50 per purchase at Namecheap, auto-approve under £25, require approval above that. No more waiting for you to manually buy domains.

### SaaS Subscriptions
Your agent spots a tool trial that needs upgrading to a paid plan. Policy: software category allowed, monthly spend cap at £200, blocked merchants list keeps out sketchy vendors. The agent handles the grunt work; you keep the guardrails.

### Local SEO Agents
A fleet of local SEO agents needs to pay for citation submissions, review tools, or directory listings. Policy: per-agent hourly limits, task-level spend caps, and duplicate detection so the same listing never gets paid for twice. Scale without surprises.

---

## Policy File Example

```yaml
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

allowed_merchants:
  - namecheap.com
  - github.com
  - canva.com

blocked_merchants:
  - sketchy-tools.biz

trusted_merchants:
  - namecheap.com

allowed_categories:
  - domains
  - software
  - hosting
  - tools

blocked_categories:
  - crypto
  - gambling

allowed_hours:
  start: "08:00"
  end: "20:00"
timezone: "Europe/London"

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
```

---

## CLI Quickstart

```bash
# Check a spend (dry run — no logging)
actonce-spend check \
  --amount 14.99 \
  --currency GBP \
  --merchant namecheap.com \
  --reason "Domain for client project" \
  --simulate

# Check a spend for real
actonce-spend check \
  --amount 14.99 \
  --currency GBP \
  --merchant namecheap.com \
  --reason "Domain for client project"

# View pending approvals
actonce-spend pending

# Approve a queued request
actonce-spend approve actonce_txn_abc123

# View recent logs
actonce-spend logs --last 20
```

---

## MCP Server Integration (OpenClaw)

Add this to your OpenClaw MCP server config:

```json
{
  "mcpServers": {
    "actonce-spend": {
      "command": "npx",
      "args": ["-y", "@actonce/spend-gateway@latest", "start", "--mcp"],
      "env": {
        "ACTONCE_POLICY_PATH": "./my-policy.yaml"
      }
    }
  }
}
```

Your agent can now call `check_spend` and `log_spend_result` directly.

See [`docs/openclaw-setup.md`](docs/openclaw-setup.md) for the full walkthrough.

---

## Free vs Pro

| Feature | Free | Pro |
|--------|------|-----|
| Local policy engine | Yes | Yes |
| MCP server + CLI | Yes | Yes |
| Duplicate detection | Yes | Yes |
| File-based approval queue | Yes | Yes |
| Telegram/Slack approval alerts (1 user) | Yes | Yes |
| Dry-run / simulate mode | Yes | Yes |
| HTTP REST API | No | Yes |
| Multi-user approval routing | No | Yes |
| Team dashboard + analytics | No | Yes |
| Advanced fraud signals | No | Yes |
| Priority support | No | Yes |

**Pro:** £19/month per user. **Team:** £79/month. **Business:** £249/month. [View plans](https://actonceapi.com/pricing)

---

## Documentation

- [`docs/quickstart.md`](docs/quickstart.md) — 5-minute getting started
- [`docs/openclaw-setup.md`](docs/openclaw-setup.md) — Add the MCP server to OpenClaw
- [`docs/stripe-link-setup.md`](docs/stripe-link-setup.md) — Connect Stripe Link CLI for payments
- [`docs/policy-reference.md`](docs/policy-reference.md) — Complete policy file reference

---

## License

MIT. See [LICENSE](LICENSE).

---

Built by [ActOnce](https://actonceapi.com). Questions? Open an issue or email hello@actonceapi.com.
# CI trigger
