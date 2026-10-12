# Landing Page Copy — ActOnce Spend Gateway

**Meta Title:** AI Agent Spending Controls — Open Source Gateway
*(54 characters)*

**Meta Description:** Open-source spending guardrails for AI agents. Local policy engine, duplicate detection, and human approval. Never touches your payment credentials.
*(154 characters)*

---

## Hero Section

### Headline
Give Your AI Agents a Wallet With Rules Built In

### Subheadline
An open-source spending gateway that sits between your agents and Stripe Link. Define hard limits in YAML. Block duplicates. Route risky spends to human approval. The gateway never sees your payment credentials — it just decides what is allowed.

**Primary CTA:** Install the Open-Source Gateway
**Secondary CTA:** View the Hosted Dashboard

---

## Pain Points (The Problem)

### Agents Can Spend. But Should They?
You hooked your agent up to Stripe Link. Now it can buy domains, upgrade SaaS plans, and spin up cloud instances. That is power without guardrails. One prompt injection or logic loop and your card gets hammered.

### Prompts Are Not Policies
Telling your agent "do not spend more than $50" in a system prompt is not enforcement. It is a suggestion. You need hard rules that the agent cannot override.

### You Cannot Scale If You Are the Bottleneck
Every purchase request lands in your inbox. You become the approval layer. That defeats the point of automation.

---

## Feature Blocks

### Policy-Driven Spending
Write your rules in YAML. Amount caps. Merchant allowlists. Category blocks. Time windows. The gateway evaluates every spend against your policy, not a prompt. Agents cannot negotiate their way past a config file.

**Icon:** shield / lock

### Duplicate Detection
Same amount, same merchant, five minutes apart? The gateway catches it. Configurable match fields and time windows. Stop double-payments before they happen.

**Icon:** refresh / loop with a slash

### Human-in-the-Loop Approval
Auto-approve routine spends under your limit. Route anything risky to a simple approval queue. Respond via CLI, Telegram, or the dashboard. Your agents keep moving. You stay in control.

**Icon:** person-check / approval stamp

---

## Integrations

Works where your agents already live.

**OpenClaw** — Native MCP server. Add three lines to your config and your agents can call `check_spend` directly.

**Hermes** — Plug into Hermes agent frameworks with the same MCP interface.

**Stripe Link** — The gateway makes decisions. Stripe handles the money. No credentials pass through the gateway.

**MCP** — Any Model Context Protocol client can consume the `check_spend` and `log_spend_result` tools.

---

## Testimonials (Placeholders)

> "We gave our SEO agent spending access and within a week it had bought three duplicate directory listings. ActOnce blocks that automatically now. I sleep better."
> — **Agency Owner**, UK Local SEO Agency

> "I was manually approving every SaaS upgrade our agent requested. The policy file took ten minutes to write and saved me hours every week."
> — **Solo Operator**, E-commerce Automation

---

## Pricing

| Plan | Free | Pro | Team | Business |
|------|------|-----|------|----------|
| Price | $0 | $24/mo | $99/mo | $299/mo |
| Local policy engine | Yes | Yes | Yes | Yes |
| MCP server + CLI | Yes | Yes | Yes | Yes |
| Duplicate detection | Yes | Yes | Yes | Yes |
| Approval queue (file-based) | Yes | Yes | Yes | Yes |
| Telegram/Slack alerts (1 user) | Yes | Yes | Yes | Yes |
| Dry-run mode | Yes | Yes | Yes | Yes |
| HTTP REST API | — | Yes | Yes | Yes |
| Multi-user approval routing | — | — | Yes | Yes |
| Team dashboard + analytics | — | — | Yes | Yes |
| Advanced fraud signals | — | — | — | Yes |
| Priority support | — | — | — | Yes |
| Users | 1 | 1 | 5 | Unlimited |

---

## FAQ

### Does the gateway handle payments?
No. It handles permission. Payments still flow through Stripe Link CLI or whatever your agent framework uses. The gateway emits `approved`, `rejected`, or `requires_approval`. Your agent then decides whether to proceed with payment.

### Is my data sent to the cloud?
Not unless you want it to. The free version is entirely local. Policy files, logs, and the approval queue live on your machine. Pro adds optional cloud dashboard syncing.

### Can an agent override the policy?
No. The policy file is the authority. Agents can request spends. They cannot approve them. The gateway runs as a separate process with its own config.

### What if I want to approve spends from my phone?
The free version supports basic Telegram or Slack webhook alerts for a single user. Pro and above add multi-user routing and a mobile-friendly dashboard.

---

## Final CTA Section

### Headline
Stop Being the Approval Bottleneck

### Body
Install the open-source gateway in under five minutes. Write your policy. Let your agents spend within guardrails.

**Primary CTA:** [Install the Open-Source Gateway](https://github.com/actonceapi/spend-gateway)
**Secondary CTA:** [View the Hosted Dashboard](https://actonceapi.com/dashboard)

---

*Built by [ActOnce](https://actonceapi.com). Open source. MIT licensed.*
