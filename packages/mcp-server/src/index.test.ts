import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DecisionRouter, type GatewayConfig } from '@actonce/core';
import { type SpendRequest, type LogEntry } from '@actonce/types';

describe('MCP Server Tools', () => {
  let tmpDir: string;
  let router: DecisionRouter;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'actonce-mcp-test-'));
    const routerConfig: GatewayConfig = {
      policyPath: './policies/starter-policy.yaml',
      dbPath: ':memory:',
      logDestination: 'stdout',
      queuePath: join(tmpDir, 'approval-queue.json'),
    };
    router = new DecisionRouter(routerConfig);
  });

  afterEach(() => {
    router.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  async function handleCheckSpend(toolArgs: Record<string, unknown>) {
    const req: SpendRequest = {
      amount: Number(toolArgs.amount),
      currency: String(toolArgs.currency),
      merchant: String(toolArgs.merchant),
      category: toolArgs.category ? String(toolArgs.category) : undefined,
      reason: toolArgs.reason ? String(toolArgs.reason) : undefined,
      agentId: toolArgs.agent_id ? String(toolArgs.agent_id) : undefined,
      taskId: toolArgs.task_id ? String(toolArgs.task_id) : undefined,
      requestId: toolArgs.request_id ? String(toolArgs.request_id) : undefined,
      timestamp: new Date('2026-05-01T12:00:00Z'),
    };

    const simulate = Boolean(toolArgs.simulate);
    const result = router.evaluate(req, simulate);

    return {
      decision: result.decision.toLowerCase(),
      transaction_reference: result.transactionReference,
      policy_matched: result.policyMatched,
      policy_reason: result.policyReason,
      approval_required: result.approvalRequired,
      dedupe_status: result.dedupeStatus,
      expires_at: result.expiresAt,
      time_to_decision_ms: result.timeToDecisionMs,
    };
  }

  async function handleLogSpendResult(toolArgs: Record<string, unknown>) {
    router.logSpendResult(
      String(toolArgs.transaction_reference),
      String(toolArgs.status) as 'completed' | 'failed',
      toolArgs.payment_method ? String(toolArgs.payment_method) : undefined,
      toolArgs.receipt_url ? String(toolArgs.receipt_url) : undefined,
      toolArgs.notes ? String(toolArgs.notes) : undefined
    );
    return { logged: true, transaction_reference: String(toolArgs.transaction_reference), status: String(toolArgs.status) };
  }

  async function handlePreviewPolicy() {
    const policy = router.getPolicy();
    return {
      version: policy.version,
      default_mode: policy.default_mode,
      currency: policy.currency,
      max_single_purchase: policy.max_single_purchase,
    };
  }

  it('check_spend approves small purchase', async () => {
    const parsed = await handleCheckSpend({
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
      category: 'domains',
      reason: 'Register domain',
    });
    expect(parsed.decision).toBe('approved');
    expect(parsed.transaction_reference).toMatch(/^actonce_txn_/);
    expect(parsed.approval_required).toBe(false);
  });

  it('check_spend rejects blocked category', async () => {
    const parsed = await handleCheckSpend({
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
      category: 'weapons',
      reason: 'Bad idea',
    });
    expect(parsed.decision).toBe('rejected');
    expect(parsed.policy_matched).toBe('blocked_category');
  });

  it('check_spend requires approval above threshold', async () => {
    const parsed = await handleCheckSpend({
      amount: 30,
      currency: 'GBP',
      merchant: 'namecheap.com',
      category: 'domains',
    });
    expect(parsed.decision).toBe('requires_approval');
    expect(parsed.approval_required).toBe(true);
  });

  it('check_spend simulate mode does not queue or log dedupe', async () => {
    const parsed = await handleCheckSpend({
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
      simulate: true,
    });
    expect(parsed.decision).toBe('approved');

    const parsed2 = await handleCheckSpend({
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
      simulate: true,
    });
    expect(parsed2.decision).toBe('approved');
  });

  it('check_spend real mode detects duplicates', async () => {
    const parsed = await handleCheckSpend({
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
    });
    expect(parsed.decision).toBe('approved');

    const parsed2 = await handleCheckSpend({
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
    });
    expect(parsed2.decision).toBe('rejected');
    expect(parsed2.policy_matched).toBe('duplicate_detected');
  });

  it('preview_policy returns policy summary', async () => {
    const parsed = await handlePreviewPolicy();
    expect(parsed.version).toBe('1.0');
    expect(parsed.currency).toBe('GBP');
    expect(parsed.max_single_purchase).toBe(50);
  });

  it('log_spend_result returns logged confirmation', async () => {
    const parsed = await handleLogSpendResult({
      transaction_reference: 'actonce_txn_test123',
      status: 'completed',
      payment_method: 'stripe_link_cli',
      notes: 'Test payment',
    });
    expect(parsed.logged).toBe(true);
    expect(parsed.status).toBe('completed');
  });
});
