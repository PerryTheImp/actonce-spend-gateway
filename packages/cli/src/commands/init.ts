import { Command } from 'commander';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

const starterPolicy = `version: "1.0"
default_mode: ask
currency: USD

# Amount controls
max_single_purchase: 50.00
max_daily_spend: 200.00
max_monthly_spend: 1000.00

# Approval thresholds
require_human_approval_above: 25.00
always_require_approval_for:
  - crypto
  - gambling
  - adult
  - weapons

# Merchant controls
allowed_merchants: []
blocked_merchants: []
trusted_merchants: []

# Category controls
allowed_categories: []
blocked_categories:
  - gambling
  - crypto
  - adult
  - weapons

# Time controls
allowed_hours:
  start: "08:00"
  end: "20:00"
timezone: "UTC"

# Duplicate prevention
dedupe_window_minutes: 30
dedupe_match_on:
  - amount
  - currency
  - merchant

# Agent/task controls
max_requests_per_agent_per_hour: 10
max_requests_per_task: 3

# Logging
log_level: info
log_destination: file
log_path: ./logs/actonce-spend.log
`;

export const initCommand = new Command('init')
  .description('Create starter policy YAML and data/logs directories in the current directory')
  .action(() => {
    const cwd = process.cwd();

    if (!existsSync(`${cwd}/data`)) {
      mkdirSync(`${cwd}/data`, { recursive: true });
      console.log('Created data/');
    }

    if (!existsSync(`${cwd}/logs`)) {
      mkdirSync(`${cwd}/logs`, { recursive: true });
      console.log('Created logs/');
    }

    const policyPath = `${cwd}/actonce-policy.yaml`;
    if (!existsSync(policyPath)) {
      writeFileSync(policyPath, starterPolicy, 'utf-8');
      console.log('Created actonce-policy.yaml');
    } else {
      console.log('actonce-policy.yaml already exists — skipped');
    }

    console.log('Done. Edit actonce-policy.yaml to match your needs, then run:');
    console.log('  export ACTONCE_POLICY_PATH="' + policyPath + '"');
    console.log('  actonce-spend check --amount 14.99 --currency USD --merchant namecheap.com --simulate');
  });
