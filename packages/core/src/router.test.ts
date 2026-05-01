import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DecisionRouter } from './router.js';
import { type SpendRequest } from '@actonce/types';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Decision Router', () => {
  let router: DecisionRouter;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'actonce-test-'));
    router = new DecisionRouter({
      policyPath: './policies/starter-policy.yaml',
      dbPath: ':memory:',
      logDestination: 'stdout',
      queuePath: join(tmpDir, 'approval-queue.json'),
    });
  });

  afterEach(() => {
    router.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const baseReq: SpendRequest = {
    amount: 14.99,
    currency: 'GBP',
    merchant: 'namecheap.com',
    category: 'domains',
    reason: 'Register domain',
    agentId: 'agent-001',
    requestId: 'req-001',
    timestamp: new Date('2026-05-01T12:00:00Z'),
  };

  it('should APPROVE a small purchase', () => {
    const result = router.evaluate(baseReq);
    expect(result.decision).toBe('APPROVED');
    expect(result.transactionReference).toMatch(/^actonce_txn_/);
    expect(result.approvalRequired).toBe(false);
    expect(result.timeToDecisionMs).toBeGreaterThanOrEqual(0);
  });

  it('should REJECT blocked category', () => {
    const req = { ...baseReq, category: 'weapons' };
    const result = router.evaluate(req);
    expect(result.decision).toBe('REJECTED');
    expect(result.policyMatched).toBe('blocked_category');
  });

  it('should REJECT amount over max_single_purchase', () => {
    const req = { ...baseReq, amount: 100 };
    const result = router.evaluate(req);
    expect(result.decision).toBe('REJECTED');
    expect(result.policyMatched).toBe('max_single_purchase_exceeded');
  });

  it('should REQUIRE_APPROVAL for amount above threshold', () => {
    const req = { ...baseReq, amount: 30 };
    const result = router.evaluate(req);
    expect(result.decision).toBe('REQUIRES_APPROVAL');
    expect(result.approvalRequired).toBe(true);
  });

  it('should detect duplicates', () => {
    const req = { ...baseReq };
    const first = router.evaluate(req);
    expect(first.dedupeStatus).toBe('new');

    const second = router.evaluate(req);
    expect(second.dedupeStatus).toBe('duplicate');
    expect(second.decision).toBe('REJECTED');
  });

  it('should queue and approve pending requests', () => {
    const req = { ...baseReq, amount: 30 };
    const result = router.evaluate(req);
    expect(result.decision).toBe('REQUIRES_APPROVAL');

    const pending = router.listPending();
    expect(pending.length).toBe(1);
    expect(pending[0].transactionReference).toBe(result.transactionReference);

    const approved = router.approve(result.transactionReference, 'perry');
    expect(approved).toBe(true);

    const afterApprove = router.listPending();
    expect(afterApprove.length).toBe(0);
  });
});
