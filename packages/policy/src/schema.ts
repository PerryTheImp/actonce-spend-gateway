import { z } from 'zod';

export const policySchema = z.object({
  version: z.string(),
  default_mode: z.enum(['ask', 'auto_approve', 'block']),
  currency: z.string(),
  max_single_purchase: z.number().nonnegative(),
  max_daily_spend: z.number().nonnegative(),
  max_monthly_spend: z.number().nonnegative(),
  require_human_approval_above: z.number().nonnegative(),
  always_require_approval_for: z.array(z.string()).default([]),
  allowed_merchants: z.array(z.string()).default([]),
  blocked_merchants: z.array(z.string()).default([]),
  trusted_merchants: z.array(z.string()).default([]),
  allowed_categories: z.array(z.string()).default([]),
  blocked_categories: z.array(z.string()).default([]),
  allowed_hours: z.object({
    start: z.string(),
    end: z.string(),
  }),
  timezone: z.string(),
  dedupe_window_minutes: z.number().nonnegative().default(30),
  dedupe_match_on: z.array(z.string()).default(['amount', 'currency', 'merchant']),
  max_requests_per_agent_per_hour: z.number().nonnegative().default(10),
  max_requests_per_task: z.number().nonnegative().default(3),
  log_level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  log_destination: z.enum(['file', 'stdout']).default('file'),
  log_path: z.string().default('./logs/actonce-spend.log'),
});

export type PolicyConfig = z.infer<typeof policySchema>;
