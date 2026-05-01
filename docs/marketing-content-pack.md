# ActOnce Spend Gateway — Marketing Content Pack

Generated: 2026-05-01
Status: Phase 3 — X/LinkedIn Launch Ready

---

## Tagline & Core Positioning

**Primary tagline:**
> Stripe gave agents a way to pay. ActOnce gives them a way to be trusted.

**Secondary tagline:**
> Safe spending controls for AI agents.

**Positioning:**
ActOnce Spend Gateway is not a payment processor. It is a decision engine that sits between agents and money. It answers one question before any spend happens: should this agent be allowed to spend this amount with this merchant right now?

**Key differentiators:**
- Local-first (no cloud, no API keys required)
- Policy-driven (rules in YAML, not prompts)
- Zero payment credential exposure
- Open source, MIT licensed
- MCP-native for OpenClaw, Hermes, and any MCP-compatible agent

---

## X (Twitter) Content

### Thread: Launch Announcement

**Tweet 1/7** (hook):
> Stripe just launched Link for Agents. AI can now spend real money.
>
> But there is a problem nobody is talking about.
>
> Agents are fast, obedient, and dumb. Give them a wallet without guardrails and they will buy the same domain twice, subscribe to the wrong plan, or spend at 3am.
>
> We built the guardrails. 🧵

**Tweet 2/7** (the product):
> Introducing ActOnce Spend Gateway.
>
> Open-source spending controls for AI agents. Before any money moves, the gateway checks:
> • Is this merchant allowed?
> • Is the amount within budget?
> • Has this exact purchase already happened?
> • Does a human need to approve this?
>
> Then it says yes, no, or wait.

**Tweet 3/7** (why it matters):
> Most agent safety today is "please be careful" in a system prompt.
>
> That is not safety. That is hope.
>
> ActOnce Spend Gateway is policy-driven, not prompt-driven. Rules live in a YAML file on your machine. Agents cannot talk their way around them.

**Tweet 4/7** (how it works):
> Install it locally. Define your policy in 10 minutes.
>
> ```
> max_single_purchase: 50
> require_human_approval_above: 25
> allowed_merchants:
>   - namecheap.com
>   - github.com
> blocked_categories:
>   - gambling
>   - crypto
> ```
>
> Connect it to OpenClaw, Hermes, or any MCP agent. Done.

**Tweet 5/7** (the Stripe angle):
> Stripe handles the payment. We handle the permission.
>
> The gateway never sees your card, your token, or your Stripe credentials. It only emits decisions: APPROVED, REJECTED, or REQUIRES_APPROVAL.
>
> Payment stays with Stripe. Safety stays with you.

**Tweet 6/7** (open source CTA):
> Free and open source. MIT license.
>
> GitHub: github.com/PerryTheImp/actonce-spend-gateway
>
> Install in 30 seconds:
> ```npm install -g @actonce/spend-gateway```
>
> Paid dashboard for teams coming soon.

**Tweet 7/7** (closing):
> Stripe gave agents a way to pay.
>
> ActOnce gives them a way to be trusted.
>
> If you are building agents that touch real money, you need this.
>
> ⭐ the repo. Share the thread. Let's build safer agentic commerce together.

---

### Single Tweets (for drip posting)

**Tweet A** (pain point):
> The next agent bug will not be a hallucination. It will be a duplicate purchase at 2am.
>
> Give your AI agents a wallet. Then give them spending rules.
>
> github.com/PerryTheImp/actonce-spend-gateway

**Tweet B** (product shot):
> AI agents should not have your card. They should have permissioned spend.
>
> ActOnce Spend Gateway — open-source policy controls for agent spending.
>
> Local. Fast. Policy-driven, not prompt-driven.
>
> github.com/PerryTheImp/actonce-spend-gateway

**Tweet C** (developer angle):
> "Simulate mode" is the most underrated feature in our MCP server.
>
> Before your agent spends real money, run a dry run. See exactly what the gateway would decide. Zero risk, full confidence.
>
> Policy-driven spending controls for OpenClaw and Hermes agents.

**Tweet D** ( Stripe partnership angle):
> Stripe built the rails. We built the guardrails.
>
> ActOnce Spend Gateway + Stripe Link for Agents = safe, permissioned AI commerce.
>
> Open source. MIT. Built for OpenClaw and MCP agents.
>
> github.com/PerryTheImp/actonce-spend-gateway

**Tweet E** (social proof placeholder):
> "I gave my OpenClaw agent a wallet, then added guardrails. Now it buys domains, renews subscriptions, and pays for SEO tools — all within budget, all with an audit trail."
>
> — First user testimonial coming soon.
>
> Want to be first? Install the gateway and tell us what you think.

---

## LinkedIn Content

### Post 1: Launch Announcement (long-form)

**Headline:**
> Stripe Launched AI Agent Payments. We Built the Missing Safety Layer.

**Body:**
Stripe just announced Link for Agents at Sessions 2026. AI agents can now spend real money on behalf of users via one-time-use cards and Shared Payment Tokens.

This is a massive shift. But it creates a new problem: how do you prevent an agent from buying the same thing twice, spending outside business hours, or subscribing to the wrong SaaS plan?

Most "agent safety" today is a politely worded system prompt. That is not safety. That is hope.

We built something concrete.

**ActOnce Spend Gateway** is an open-source decision layer that sits between AI agents and payment flows. Before any money moves, it checks every spend request against a local policy file:

• Merchant allow/block lists
• Amount limits and approval thresholds
• Duplicate detection within time windows
• Business hours and timezone rules
• Category controls

It returns one of three answers: APPROVED, REJECTED, or REQUIRES_APPROVAL.

The gateway never touches payment credentials. Stripe handles the money. We handle the permission.

**Built for:** OpenClaw, Hermes, and any MCP-compatible agent.
**Stack:** TypeScript, local-first, SQLite-backed, MIT licensed.
**Install:** `npm install -g @actonce/spend-gateway`

The repo is live. The CI is green. The docs are written.

If you are building agents that touch real money, I would love your feedback.

#AIAgents #AgenticCommerce #OpenClaw #Stripe #MCP #OpenSource #Fintech

---

### Post 2: Technical Deep Dive

**Headline:**
> Why I Built an Open-Source Spend Gateway for AI Agents

**Body:**
I have been building with OpenClaw and Hermes for months. The tools are incredible. But every time I connect an agent to a real-world action — buying a domain, renewing a subscription, paying for a citation — I feel the same tension.

The agent is fast, obedient, and dumb. It does exactly what I tell it to do. Sometimes that means it does the same thing twice. Or it buys the wrong plan. Or it spends at 3am because I forgot to add a time restriction.

System prompts are not controls. "Please double-check before buying" is not a safety mechanism.

So I built ActOnce Spend Gateway. Here is how it works under the hood:

**Policy engine:** Loads a YAML file and evaluates 11 decision rules in sequence. Blocked merchant? Reject immediately. Over budget? Queue for approval. Duplicate detected? Block or warn.

**Duplicate detector:** SQLite-backed with configurable match keys. Detects identical spends within a time window. Prevents the £14.99 Namecheap domain from being bought twice in 30 minutes.

**Approval queue:** File-based for local dev, with optional Telegram webhook. When a spend needs human approval, the owner gets a ping. Tap yes or no. Done.

**MCP server:** Stdio-based, so OpenClaw and Hermes can call `check_spend` and `log_spend_result` natively.

**CLI:** `actonce-spend init` creates a starter policy. `actonce-spend check` tests a spend. `actonce-spend pending` shows the queue.

The entire thing is local-first. No cloud. No API keys. No data leaving your machine.

I am opening it up because I think every agent that can spend money needs this. Not just my agents. Every agent.

GitHub: github.com/PerryTheImp/actonce-spend-gateway

Feedback, issues, and contributions welcome.

---

### Post 3: Use Case / Story

**Headline:**
> My SEO Agent Just Bought a Domain Without Asking Me

**Body:**
...and that is exactly what I wanted.

I run a local SEO agency. We build rank-and-rent sites, manage citations, and handle client domain renewals. For months, every domain purchase meant me stopping what I was doing, logging into Namecheap, and manually checking out.

Now my OpenClaw agent handles it. Here is the policy I set:

```yaml
currency: GBP
max_single_purchase: 50.00
require_human_approval_above: 25.00
allowed_merchants:
  - namecheap.com
trusted_merchants:
  - namecheap.com
dedupe_window_minutes: 30
```

Under £25 at Namecheap? Auto-approved. The agent buys the domain, logs the transaction, and moves on.

Over £25? I get a Telegram message. Tap approve. Done.

Same domain twice in 30 minutes? Blocked. The agent gets a clear rejection and tries a different name.

I still have full control. But I do not have to be the checkout clerk anymore.

This is what ActOnce Spend Gateway was built for. Not to remove human oversight. To remove human friction from the decisions that are already obvious.

If you are running AI agents for real business tasks — especially ones that involve spending money — you need policy-driven controls, not prompt-driven hope.

Try it: github.com/PerryTheImp/actonce-spend-gateway

---

## GitHub README CTA Update

**Add to the top of README.md (below the headline):**

```markdown
[![CI](https://github.com/PerryTheImp/actonce-spend-gateway/actions/workflows/main.yml/badge.svg)](https://github.com/PerryTheImp/actonce-spend-gateway/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

**Add to README.md after the install section:**

```markdown
## Why This Exists

Stripe just launched [Link for Agents](https://stripe.com/blog/giving-agents-the-ability-to-pay). AI agents can now spend real money. That changes everything — and creates a new problem.

Agents are fast, obedient, and literal. Without hard guardrails, they will buy the same thing twice, spend outside business hours, or subscribe to the wrong plan. System prompts are not safety mechanisms.

ActOnce Spend Gateway is the missing layer: policy-driven spending controls that sit between your agent and the payment flow.
```

---

## Website/Landing Page Snippets

### Hero Section

**Headline:**
> Give AI Agents Spending Power Without Losing Control

**Subheadline:**
> Open-source policy controls for AI agents using Stripe Link, OpenClaw, Hermes, and MCP. Local-first. Zero credential exposure. MIT licensed.

**CTA primary:**
> Install the open-source gateway

**CTA secondary:**
> View the hosted dashboard

---

### Pain Points Section

**Headline:** The Problem With Agent Payments

**Three pain points:**

1. **Agents are literal**
   > "Buy a domain for the project" can mean the same domain twice. Or the wrong TLD. Or at 3am. Without policy, the agent does exactly what you say — not what you meant.

2. **Prompts are not controls**
   > "Please be careful with spending" is not a safety mechanism. It is a suggestion that an agent can ignore, misinterpret, or forget across sessions.

3. **Audit trails matter**
   > When an agent spends money, someone will ask "why did it buy this?" You need a clear answer: the policy, the approval, the timestamp, and the reason.

---

### Feature Blocks

**1. Policy-Driven Controls**
> Define spending rules in a simple YAML file. Amount limits, merchant allowlists, category blocks, business hours, and duplicate windows. The agent cannot override them.

**2. Duplicate Detection**
> SQLite-backed deduplication prevents the same purchase from happening twice within a configurable time window. No more double domain registrations or duplicate SaaS subscriptions.

**3. Human-in-the-Loop**
> When a purchase exceeds your policy threshold, the gateway queues it for approval. Get a Telegram alert, tap yes or no, and the agent proceeds or stops. Full audit trail included.

**4. MCP-Native**
> Built as an MCP server for OpenClaw, Hermes, and any MCP-compatible agent. Integrates in minutes with a simple JSON config. No middleware, no proxies.

---

### Integration Logos Section

Show logos for:
- OpenClaw
- Hermes (Nous Research)
- Stripe Link
- MCP (Model Context Protocol)

With text: *Works with the tools you already use.*

---

### Social Proof Placeholders

**Testimonial 1:**
> "I gave my OpenClaw agent a wallet and guardrails. Now it handles domain purchases, SaaS renewals, and SEO tool subscriptions — all within budget, all with proof."
> — Early adopter, Agency Owner

**Testimonial 2:**
> "The simulate mode saved me twice before I even went live. I could test my policy against real spend scenarios without risking actual money."
> — Developer, AI Automation Studio

---

### Pricing Table (for landing page)

| | Free | Pro | Team | Business |
|---|---|---|---|---|
| | Open Source | £19/mo | £79/mo | £249/mo |
| Policy engine | ✅ | ✅ | ✅ | ✅ |
| MCP server + CLI | ✅ | ✅ | ✅ | ✅ |
| Duplicate detection | ✅ | ✅ | ✅ | ✅ |
| Approval queue | ✅ | ✅ | ✅ | ✅ |
| Telegram/Slack alerts (1 user) | ✅ | ✅ | ✅ | ✅ |
| Simulate / dry-run mode | ✅ | ✅ | ✅ | ✅ |
| HTTP REST API | ❌ | ✅ | ✅ | ✅ |
| Multi-user approval routing | ❌ | ❌ | ✅ | ✅ |
| Team dashboard + analytics | ❌ | ❌ | ✅ | ✅ |
| Advanced fraud signals | ❌ | ❌ | ❌ | ✅ |
| Priority support | ❌ | ❌ | ❌ | ✅ |
| Audit exports | ❌ | ✅ | ✅ | ✅ |

---

## FAQ (for landing page and docs)

**Q: Does this handle payments?**
> No. The gateway is a decision engine only. It says yes, no, or wait. Stripe Link CLI or your preferred payment method handles the actual transaction.

**Q: Do I need to send data to the cloud?**
> No. The open-source version is entirely local. Policy files, logs, and the dedupe database live on your machine. No API keys, no external services.

**Q: Which agents does this work with?**
> Any MCP-compatible agent. Tested with OpenClaw and Hermes. Works with Claude Code, Cursor, and any framework that supports the Model Context Protocol.

**Q: What if I want team controls?**
> The Pro version adds a hosted dashboard with multi-user approval routing, team analytics, and advanced policy templates. Coming soon.

**Q: Is it really free?**
> The core gateway is open source under MIT license. You can use it, modify it, and redistribute it. The hosted Pro dashboard is a paid SaaS product.

---

## Content Calendar (Suggested)

| Day | Channel | Content |
|-----|---------|---------|
| Day 1 | X | Thread: Launch announcement (7 tweets) |
| Day 1 | LinkedIn | Post 1: Launch announcement (long-form) |
| Day 2 | X | Tweet A: Pain point angle |
| Day 3 | X | Tweet B: Product shot angle |
| Day 3 | LinkedIn | Post 2: Technical deep dive |
| Day 4 | X | Tweet C: Simulate mode feature |
| Day 5 | X | Tweet D: Stripe partnership angle |
| Day 5 | LinkedIn | Post 3: Use case / story |
| Day 6 | X | Tweet E: Social proof placeholder |
| Day 7 | GitHub | Update README with badges and "Why This Exists" section |
| Day 8 | X | Quote tweet someone building with agents + offer gateway |
| Day 9 | LinkedIn | Post 4: FAQ round-up |
| Day 10 | X | Demo video/GIF of CLI in action |
| Day 10 | LinkedIn | Post 5: Integration walkthrough (OpenClaw setup) |

---

## Next Actions Checklist

- [ ] Update README.md with CI badge, license badge, "Why This Exists" section
- [ ] Create a short demo GIF or video of `actonce-spend init` + `check` + `pending` + `approve`
- [ ] Write a launch post on X using the 7-tweet thread
- [ ] Write a launch post on LinkedIn using Post 1
- [ ] Set up a simple landing page (could be a GitHub Pages site from the repo)
- [ ] Prepare a Hacker News "Show HN" post for extra visibility
- [ ] Reach out to 3-5 early users for testimonials
- [ ] Set up Google Analytics or Plausible on the landing page
- [ ] Create a waitlist for the Pro dashboard
- [ ] Schedule follow-up content for Days 2-10

---

*Hendrix sign-off: All content is ready to publish. Tone is sharp, direct, and developer-friendly. The Stripe angle is clear without overclaiming partnership. The product promise is concrete. Ready to launch.*
