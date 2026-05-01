import { describe, it, expect } from 'vitest';
import { evaluatePolicy } from './engine.js';
import { type PolicyConfig, type SpendRequest } from '@actonce/types';

const basePolicy: PolicyConfig = {
  version: '1.0',
  default_mode: 'ask',
  currency: 'GBP',
  max_single_purchase: 50,
  max_daily_spend: 200,
  max_monthly_spend: 1000,
  require_human_approval_above: 25,
  always_require_approval_for: ['crypto', 'gambling'],
  allowed_merchants: [],
  blocked_merchants: ['badmerchant.com'],
  trusted_merchants: ['trusted.com'],
  allowed_categories: [],
  blocked_categories: ['adult', 'weapons'],
  allowed_hours: { start: '08:00', end: '20:00' },
  timezone: 'UTC',
  dedupe_window_minutes: 30,
  dedupe_match_on: ['amount', 'currency', 'merchant'],
  max_requests_per_agent_per_hour: 10,
  max_requests_per_task: 3,
  log_level: 'info',
  log_destination: 'file',
  log_path: './logs/test.log',
};

const baseRequest: SpendRequest = {
  amount: 14.99,
  currency: 'GBP',
  merchant: 'trusted.com',
  category: 'software',
  reason: 'Test purchase',
  agentId: 'agent-001',
  taskId: 'task-001',
  timestamp: new Date('2026-05-01T12:00:00Z'),
};

describe('Policy Engine', () => {
  it('should APPROVE a trusted merchant under limit', () => {
    const result = evaluatePolicy(baseRequest, basePolicy);
    expect(result.decision).toBe('APPROVED');
    expect(result.policyMatched).toBe('all_checks_passed');
  });

  it('should REJECT blocked merchant', () => {
    const req = { ...baseRequest, merchant: 'badmerchant.com' };
    const result = evaluatePolicy(req, basePolicy);
    expect(result.decision).toBe('REJECTED');
    expect(result.policyMatched).toBe('blocked_merchant');
  });

  it('should REJECT blocked category', () => {
    const req = { ...baseRequest, category: 'adult' };
    const result = evaluatePolicy(req, basePolicy);
    expect(result.decision).toBe('REJECTED');
    expect(result.policyMatched).toBe('blocked_category');
  });

  it('should REJECT amount over max_single_purchase', () => {
    const req = { ...baseRequest, amount: 100 };
    const result = evaluatePolicy(req, basePolicy);
    expect(result.decision).toBe('REJECTED');
    expect(result.policyMatched).toBe('max_single_purchase_exceeded');
  });

  it('should REJECT merchant not in allowed list when list is non-empty', () => {
    const policy = { ...basePolicy, allowed_merchants: ['onlythis.com'] };
    const result = evaluatePolicy(baseRequest, policy);
    expect(result.decision).toBe('REJECTED');
    expect(result.policyMatched).toBe('merchant_not_allowed');
  });

  it('should REQUIRE_APPROVAL for amount above threshold', () => {
    const req = { ...baseRequest, amount: 30 };
    const result = evaluatePolicy(req, basePolicy);
    expect(result.decision).toBe('REQUIRES_APPROVAL');
    expect(result.policyMatched).toBe('amount_above_threshold');
  });

  it('should REQUIRE_APPROVAL for always-approval category', () => {
    const req = { ...baseRequest, category: 'crypto' };
    const result = evaluatePolicy(req, basePolicy);
    expect(result.decision).toBe('REQUIRES_APPROVAL');
    expect(result.policyMatched).toBe('category_requires_approval');
  });

  it('should REQUIRE_APPROVAL outside allowed hours', () => {
    const req = { ...baseRequest, timestamp: new Date('2026-05-01T03:00:00Z') };
    const result = evaluatePolicy(req, basePolicy);
    expect(result.decision).toBe('REQUIRES_APPROVAL');
    expect(result.policyMatched).toBe('outside_allowed_hours');
  });

  it('should APPROVE within allowed hours', () => {
    const req = { ...baseRequest, timestamp: new Date('2026-05-01T12:00:00Z') };
    const result = evaluatePolicy(req, basePolicy);
    expect(result.decision).toBe('APPROVED');
  });

  it('should handle default_mode block', () => {
    const policy = { ...basePolicy, default_mode: 'block' };
    const result = evaluatePolicy(baseRequest, policy);
    expect(result.decision).toBe('REJECTED');
    expect(result.policyMatched).toBe('default_block');
  });
});
