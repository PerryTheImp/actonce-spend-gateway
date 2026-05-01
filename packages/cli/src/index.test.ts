import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';

const cliPath = new URL('../dist/index.js', import.meta.url).pathname;

describe('CLI commands', () => {
  let tmpDir: string;
  let env: Record<string, string>;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'actonce-cli-test-'));
    env = {
      ...process.env,
      ACTONCE_POLICY_PATH: join(tmpDir, 'actonce-policy.yaml'),
      ACTONCE_DB_PATH: ':memory:',
      ACTONCE_LOG_PATH: join(tmpDir, 'actonce-spend.log'),
      ACTONCE_LOG_DESTINATION: 'file',
      ACTONCE_QUEUE_PATH: join(tmpDir, 'approval-queue.json'),
    };

    // Write a test policy with wide hours so tests pass regardless of local time
    const testPolicy = `version: "1.0"
default_mode: ask
currency: GBP
max_single_purchase: 50.00
max_daily_spend: 200.00
max_monthly_spend: 1000.00
require_human_approval_above: 25.00
always_require_approval_for:
  - crypto
  - gambling
  - adult
  - weapons
allowed_merchants: []
blocked_merchants: []
trusted_merchants: []
allowed_categories: []
blocked_categories:
  - gambling
  - crypto
  - adult
  - weapons
allowed_hours:
  start: "00:00"
  end: "23:59"
timezone: "UTC"
dedupe_window_minutes: 30
dedupe_match_on:
  - amount
  - currency
  - merchant
max_requests_per_agent_per_hour: 10
max_requests_per_task: 3
log_level: info
log_destination: file
log_path: ${env.ACTONCE_LOG_PATH}
`;
    writeFileSync(env.ACTONCE_POLICY_PATH, testPolicy, 'utf-8');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function run(args: string[]): { stdout: string; stderr: string; status: number | null } {
    const result = spawnSync('node', [cliPath, ...args], {
      encoding: 'utf-8',
      env,
      cwd: process.cwd(),
    });
    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      status: result.status,
    };
  }

  it('init creates policy and dirs', () => {
    const initDir = mkdtempSync(join(tmpdir(), 'actonce-init-'));
    const r = spawnSync('node', [cliPath, 'init'], { encoding: 'utf-8', env, cwd: initDir });
    expect(r.status).toBe(0);
    expect(existsSync(join(initDir, 'actonce-policy.yaml'))).toBe(true);
    expect(existsSync(join(initDir, 'data'))).toBe(true);
    expect(existsSync(join(initDir, 'logs'))).toBe(true);
    rmSync(initDir, { recursive: true, force: true });
  });

  it('check approves small purchase', () => {
    const r = run([
      'check',
      '--amount', '14.99',
      '--currency', 'GBP',
      '--merchant', 'namecheap.com',
      '--category', 'domains',
      '--simulate',
    ]);
    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout);
    expect(out.decision).toBe('approved');
    expect(out.transaction_reference).toMatch(/^actonce_txn_/);
  });

  it('check rejects blocked category', () => {
    const r = run([
      'check',
      '--amount', '14.99',
      '--currency', 'GBP',
      '--merchant', 'namecheap.com',
      '--category', 'weapons',
      '--simulate',
    ]);
    expect(r.status).toBe(1);
    const out = JSON.parse(r.stdout);
    expect(out.decision).toBe('rejected');
    expect(out.policy_matched).toBe('blocked_category');
  });

  it('check requires approval above threshold', () => {
    const r = run([
      'check',
      '--amount', '30',
      '--currency', 'GBP',
      '--merchant', 'namecheap.com',
      '--simulate',
    ]);
    expect(r.status).toBe(0); // requires_approval is not a rejection exit code
    const out = JSON.parse(r.stdout);
    expect(out.decision).toBe('requires_approval');
    expect(out.approval_required).toBe(true);
  });

  it('pending lists queued approvals', () => {
    // First, queue something
    run([
      'check',
      '--amount', '30',
      '--currency', 'GBP',
      '--merchant', 'namecheap.com',
    ]);

    const r = run(['pending']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('30 GBP');
    expect(r.stdout).toContain('namecheap.com');
  });

  it('approve resolves a pending request', () => {
    const check = run([
      'check',
      '--amount', '30',
      '--currency', 'GBP',
      '--merchant', 'namecheap.com',
    ]);
    const checkOut = JSON.parse(check.stdout);
    const ref = checkOut.transaction_reference;

    const r = run(['approve', ref, '--by', 'tester']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('Approved');

    const after = run(['pending']);
    expect(after.stdout).toContain('No pending approvals');
  });

  it('reject removes a pending request', () => {
    const check = run([
      'check',
      '--amount', '30',
      '--currency', 'GBP',
      '--merchant', 'namecheap.com',
    ]);
    const checkOut = JSON.parse(check.stdout);
    const ref = checkOut.transaction_reference;

    const r = run(['reject', ref, '--reason', 'Too expensive', '--by', 'tester']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('Rejected');

    const after = run(['pending']);
    expect(after.stdout).toContain('No pending approvals');
  });

  it('logs shows entries', () => {
    run([
      'check',
      '--amount', '14.99',
      '--currency', 'GBP',
      '--merchant', 'namecheap.com',
    ]);

    const r = run(['logs', '--last', '5']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('APPROVED');
  });

  it('logs filters by decision', () => {
    run([
      'check',
      '--amount', '14.99',
      '--currency', 'GBP',
      '--merchant', 'namecheap.com',
      '--category', 'weapons',
    ]);

    const r = run(['logs', '--last', '5', '--decision', 'rejected']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('REJECTED');
  });
});
