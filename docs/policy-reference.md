# Policy File Reference

Complete documentation for every field in an ActOnce Spend Gateway policy file.

---

## File Format

Policy files are YAML. The gateway loads them at startup. Changes require a restart (or a reload signal if supported by your setup).

---

## Top-Level Fields

### `version`
- **Type:** string
- **Required:** yes
- **Description:** Policy schema version. Current valid value is `"1.0"`.
- **Example:** `version: "1.0"`

### `default_mode`
- **Type:** string
- **Required:** yes
- **Allowed values:** `ask`, `auto_approve`, `block`
- **Description:** What to do when a request does not match any specific rule and no hard limit is breached.
  - `ask` — require human approval (safest default)
  - `auto_approve` — allow the spend
  - `block` — reject the spend
- **Example:** `default_mode: ask`

### `currency`
- **Type:** string (ISO 4217 code)
- **Required:** yes
- **Description:** Default currency for amount comparisons and limits. Requests in other currencies are converted if a rate source is available; otherwise they may be rejected.
- **Example:** `currency: GBP`

---

## Amount Controls

### `max_single_purchase`
- **Type:** number (decimal)
- **Required:** no
- **Description:** Maximum allowed amount for any single spend request. Requests above this are rejected immediately, regardless of other rules.
- **Example:** `max_single_purchase: 50.00`

### `max_daily_spend`
- **Type:** number (decimal)
- **Required:** no
- **Description:** Maximum total spend allowed per calendar day. Resets at midnight in the configured timezone.
- **Example:** `max_daily_spend: 200.00`

### `max_monthly_spend`
- **Type:** number (decimal)
- **Required:** no
- **Description:** Maximum total spend allowed per calendar month. Resets on the 1st at midnight in the configured timezone.
- **Example:** `max_monthly_spend: 1000.00`

---

## Approval Thresholds

### `require_human_approval_above`
- **Type:** number (decimal)
- **Required:** no
- **Description:** Any single spend above this amount triggers `REQUIRES_APPROVAL` instead of auto-approval, unless another rule blocks it first.
- **Example:** `require_human_approval_above: 25.00`

### `always_require_approval_for`
- **Type:** array of strings
- **Required:** no
- **Description:** Categories that always require human approval, even if the amount is low and the merchant is trusted. Common entries: `crypto`, `gambling`, `adult`, `weapons`.
- **Example:**
  ```yaml
  always_require_approval_for:
    - crypto
    - gambling
  ```

---

## Merchant Controls

### `allowed_merchants`
- **Type:** array of strings
- **Required:** no
- **Description:** If this list is present, only merchants on it are permitted. All others are rejected. Leave empty or omit to allow any merchant (subject to other rules).
- **Example:**
  ```yaml
  allowed_merchants:
    - namecheap.com
    - github.com
    - canva.com
  ```

### `blocked_merchants`
- **Type:** array of strings
- **Required:** no
- **Description:** Merchants that are always rejected, regardless of amount or category. Evaluated before `allowed_merchants`.
- **Example:**
  ```yaml
  blocked_merchants:
    - sketchy-tools.biz
  ```

### `trusted_merchants`
- **Type:** array of strings
- **Required:** no
- **Description:** Merchants that bypass certain approval thresholds. A spend at a trusted merchant under `require_human_approval_above` may be auto-approved even if it exceeds the normal low threshold, depending on your policy version.
- **Example:**
  ```yaml
  trusted_merchants:
    - namecheap.com
    - github.com
  ```

---

## Category Controls

### `allowed_categories`
- **Type:** array of strings
- **Required:** no
- **Description:** If present, only these categories are permitted. Category strings are free-form — they must match what your agent sends in the `category` field of `check_spend`.
- **Example:**
  ```yaml
  allowed_categories:
    - domains
    - software
    - hosting
    - tools
    - travel
  ```

### `blocked_categories`
- **Type:** array of strings
- **Required:** no
- **Description:** Categories that are always rejected. Evaluated before `allowed_categories`.
- **Example:**
  ```yaml
  blocked_categories:
    - crypto
    - gambling
    - adult
    - weapons
  ```

---

## Time Controls

### `allowed_hours`
- **Type:** object with `start` and `end`
- **Required:** no
- **Description:** Window during which auto-approvals are allowed. Requests outside this window may be rejected or require approval based on your gateway version and settings.
- **Example:**
  ```yaml
  allowed_hours:
    start: "08:00"
    end: "20:00"
  ```

### `timezone`
- **Type:** string (tz database name)
- **Required:** no (defaults to UTC)
- **Description:** Timezone used for `allowed_hours`, daily resets, and monthly resets.
- **Example:** `timezone: "Europe/London"`

---

## Duplicate Prevention

### `dedupe_window_minutes`
- **Type:** integer
- **Required:** no (default: 30)
- **Description:** How far back to look for duplicate spend requests. A value of `0` disables deduplication.
- **Example:** `dedupe_window_minutes: 30`

### `dedupe_match_on`
- **Type:** array of strings
- **Required:** no
- **Allowed values:** `amount`, `currency`, `merchant`, `category`, `agent_id`, `task_id`
- **Description:** Which fields must match to count as a duplicate. More fields = stricter matching.
- **Example:**
  ```yaml
  dedupe_match_on:
    - amount
    - currency
    - merchant
  ```

### `dedupe_action`
- **Type:** string
- **Required:** no
- **Allowed values:** `block`, `warn`, `require_approval`
- **Description:** What to do when a duplicate is detected.
  - `block` — reject immediately
  - `warn` — approve but add a warning flag to the log
  - `require_approval` — escalate to human approval
- **Example:** `dedupe_action: block`

---

## Agent and Task Controls

### `max_requests_per_agent_per_hour`
- **Type:** integer
- **Required:** no
- **Description:** Rate limit per unique `agent_id`. Prevents runaway agents from flooding the gateway.
- **Example:** `max_requests_per_agent_per_hour: 10`

### `max_requests_per_task`
- **Type:** integer
- **Required:** no
- **Description:** Maximum spend checks allowed for a single `task_id`. Use this to cap spending within one project or workflow.
- **Example:** `max_requests_per_task: 3`

---

## Logging

### `log_level`
- **Type:** string
- **Required:** no
- **Allowed values:** `debug`, `info`, `warn`, `error`
- **Description:** Verbosity of the gateway's own internal logs (not the decision log).
- **Example:** `log_level: info`

### `log_destination`
- **Type:** string
- **Required:** no
- **Allowed values:** `file`, `stdout`
- **Description:** Where to write internal logs. Decision logs always go to the file specified by `log_path`.
- **Example:** `log_destination: file`

### `log_path`
- **Type:** string (file path)
- **Required:** no
- **Description:** Path to the append-only decision log. Every `check_spend` and `log_spend_result` call writes here. Use absolute paths in production.
- **Example:** `log_path: ./logs/actonce-spend.log`

---

## Policy Evaluation Order

Rules are checked in this order. The first matching rule wins:

1. Is the agent/task known? (if not, `default_mode` applies)
2. Is merchant in `blocked_merchants`? → **REJECT**
3. Is category in `blocked_categories`? → **REJECT**
4. Is amount > `max_single_purchase`? → **REJECT**
5. Is merchant in `allowed_merchants`? (if the list exists and merchant is missing → **REJECT**)
6. Is amount > `require_human_approval_above`? → **REQUIRES_APPROVAL**
7. Is category in `always_require_approval_for`? → **REQUIRES_APPROVAL**
8. Is this a duplicate (per `dedupe_match_on` and `dedupe_window_minutes`)? → action per `dedupe_action`
9. Is daily or monthly limit exceeded? → **REQUIRES_APPROVAL**
10. Is request outside `allowed_hours`? → **REQUIRES_APPROVAL**
11. All clear → **APPROVED**

---

## Full Example Policy

```yaml
version: "1.0"
default_mode: ask
currency: GBP

max_single_purchase: 100.00
max_daily_spend: 500.00
max_monthly_spend: 5000.00

require_human_approval_above: 50.00
always_require_approval_for:
  - crypto
  - gambling
  - adult

allowed_merchants:
  - namecheap.com
  - github.com
  - canva.com
  - aws.amazon.com
  - vercel.com

blocked_merchants:
  - sketchy-tools.biz

trusted_merchants:
  - namecheap.com
  - github.com

allowed_categories:
  - domains
  - software
  - hosting
  - tools
  - infrastructure

blocked_categories:
  - crypto
  - gambling
  - adult
  - weapons

allowed_hours:
  start: "08:00"
  end: "22:00"
timezone: "Europe/London"

dedupe_window_minutes: 60
dedupe_match_on:
  - amount
  - currency
  - merchant
dedupe_action: require_approval

max_requests_per_agent_per_hour: 20
max_requests_per_task: 5

log_level: info
log_destination: file
log_path: ./logs/actonce-spend.log
```

---

## Tips

- Start restrictive. Use `default_mode: ask` and tight limits. Loosen as you gain confidence.
- Use `trusted_merchants` for vendors you buy from regularly. It reduces approval noise.
- Set `max_requests_per_task` low for one-off workflows. A single task should not rack up unlimited spends.
- Keep `blocked_categories` broad. It is easier to maintain than a long `blocked_merchants` list.
- Use absolute paths for `log_path` when running under MCP or systemd.
