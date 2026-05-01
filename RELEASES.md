# Release Notes: ActOnce Spend Gateway v0.1.0

**Release Date:** 2026-05-01  
**Status:** Stable  
**License:** MIT

---

## Overview

The first public release of ActOnce Spend Gateway — an open-source spending control layer for AI agents. Built for OpenClaw, Hermes, and any MCP-compatible agent framework.

---

## What's Included

### Core Engine (Phase 1)
- **Policy engine** with 11-step evaluation: blocked merchants/categories, amount limits, approval thresholds, time windows, duplicate detection
- **SQLite-backed dedupe detector** with configurable match keys and time windows
- **Decision router** generating `actonce_txn_{uuid}` references
- **File-based approval queue** with optional Telegram webhook
- **Append-only JSON logger** with full audit context
- **4 example policies**: starter, agency, ecommerce, developer

### MCP Server (Phase 2)
- Stdio-based MCP server using `@modelcontextprotocol/sdk`
- Three tools exposed:
  - `check_spend` — evaluates requests, returns approve/reject/require_approval
  - `log_spend_result` — records payment completion/failure
  - `preview_policy` — lets agents self-check before calling

### CLI (Phase 2)
- `actonce-spend init` — creates starter policy + directories
- `actonce-spend start --mcp` — launches MCP server
- `actonce-spend check` — with `--simulate` dry-run flag
- `actonce-spend pending` — lists queued approvals
- `actonce-spend approve <reference>` — approves queued request
- `actonce-spend reject <reference> --reason` — rejects queued request
- `actonce-spend logs` — with `--last`, `--agent-id`, `--merchant`, `--decision` filters

### Landing Page (Phase 3)
- Premium dark-themed responsive landing page
- Animated hero video background
- Interactive demo terminal
- FAQ accordion
- Pricing table (Free/Pro/Team/Business)
- Social share buttons (X, LinkedIn, GitHub)
- Copy-to-clipboard install commands
- Mobile-responsive with hamburger menu

### Infrastructure
- TypeScript monorepo with npm workspaces
- 37 tests passing (policy, dedupe, router, MCP server, CLI)
- CI/CD via GitHub Actions across Node 18, 20, 22
- MIT license

---

## Installation

```bash
npm install -g @actonce/spend-gateway
actonce-spend init
actonce-spend start --mcp
```

---

## Known Limitations

- Simulate mode currently evaluates policy but still logs; full dry-run without side effects coming in v0.2.0
- Telegram webhook supports single user/channel only; multi-user routing in Pro dashboard
- HTTP REST API reserved for Pro tier; free tier is MCP + CLI only

---

## What's Next (v0.2.0)

- [ ] Full simulate mode with zero side effects
- [ ] `get_policy_summary` MCP tool for agent self-checking
- [ ] Webhook Guard integration (duplicate prevention for Stripe sellers)
- [ ] Enhanced fraud signals (merchant risk scoring)
- [ ] Pro dashboard alpha (waitlist opening)

---

## Acknowledgements

Built with:
- `@modelcontextprotocol/sdk`
- `commander`
- `better-sqlite3`
- `zod`
- `js-yaml`
- `vitest`

---

**Full Changelog:** Compare with future releases at `https://github.com/PerryTheImp/actonce-spend-gateway/releases`

**Questions?** Open an issue or email hello@actonceapi.com
