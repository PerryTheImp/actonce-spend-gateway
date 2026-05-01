import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DedupeDetector } from './detector.js';
import { type SpendRequest } from '@actonce/types';

describe('Dedupe Detector', () => {
  let detector: DedupeDetector;

  beforeEach(() => {
    detector = new DedupeDetector({
      windowMinutes: 30,
      matchKeys: ['amount', 'currency', 'merchant'],
      action: 'block',
      dbPath: ':memory:',
    });
  });

  afterEach(() => {
    detector.close();
  });

  it('should return new for first request', () => {
    const req: SpendRequest = {
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
      agentId: 'agent-001',
    };
    const result = detector.check(req);
    expect(result.status).toBe('new');
  });

  it('should detect duplicate within window', () => {
    const req: SpendRequest = {
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
      agentId: 'agent-001',
    };
    detector.record(req, 'actonce_txn_001', new Date());
    const result = detector.check(req);
    expect(result.status).toBe('duplicate');
    expect(result.action).toBe('block');
    expect(result.previousReference).toBe('actonce_txn_001');
  });

  it('should not detect duplicate outside window', () => {
    const req: SpendRequest = {
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
      agentId: 'agent-001',
    };
    const oldDate = new Date(Date.now() - 31 * 60 * 1000);
    detector.record(req, 'actonce_txn_001', oldDate);
    const result = detector.check(req);
    expect(result.status).toBe('new');
  });

  it('should not match different amount', () => {
    const req1: SpendRequest = {
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
    };
    const req2: SpendRequest = {
      amount: 29.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
    };
    detector.record(req1, 'actonce_txn_001', new Date());
    const result = detector.check(req2);
    expect(result.status).toBe('new');
  });

  it('should use warn action when configured', () => {
    const warnDetector = new DedupeDetector({
      windowMinutes: 30,
      matchKeys: ['amount', 'currency', 'merchant'],
      action: 'warn',
      dbPath: ':memory:',
    });
    const req: SpendRequest = {
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
    };
    warnDetector.record(req, 'actonce_txn_001', new Date());
    const result = warnDetector.check(req);
    expect(result.status).toBe('duplicate');
    expect(result.action).toBe('warn');
    warnDetector.close();
  });
});
