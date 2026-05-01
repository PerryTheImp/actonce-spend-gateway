import { v4 as uuidv4 } from 'uuid';
import {
  type SpendRequest,
  type DecisionResult,
  type SpendDecision,
  type LogEntry,
  type DedupeAction,
  type DedupeMatch,
  type PendingApproval,
  type PolicyConfig,
} from '@actonce/types';
import { evaluatePolicy, loadPolicyOrDefault } from '@actonce/policy';
import { DedupeDetector } from '@actonce/dedupe';
import { ActOnceLogger } from '@actonce/logger';
import { ApprovalQueue } from '@actonce/approval';

export interface GatewayConfig {
  policyPath?: string;
  dbPath?: string;
  logPath?: string;
  logDestination?: 'file' | 'stdout';
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  queuePath?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
}

export class DecisionRouter {
  private policy: PolicyConfig;
  private dedupe: DedupeDetector;
  private logger: ActOnceLogger;
  private approvalQueue: ApprovalQueue;

  constructor(private config: GatewayConfig) {
    this.policy = loadPolicyOrDefault(config.policyPath);

    this.dedupe = new DedupeDetector({
      windowMinutes: this.policy.dedupe_window_minutes,
      matchKeys: this.policy.dedupe_match_on,
      action: 'block',
      dbPath: config.dbPath || ':memory:',
    });

    this.logger = new ActOnceLogger({
      level: (config.logLevel || this.policy.log_level) as 'debug' | 'info' | 'warn' | 'error',
      destination: (config.logDestination || this.policy.log_destination) as 'file' | 'stdout',
      path: config.logPath || this.policy.log_path,
    });

    this.approvalQueue = new ApprovalQueue({
      queuePath: config.queuePath || './data/approval-queue.json',
      telegramBotToken: config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN,
      telegramChatId: config.telegramChatId || process.env.TELEGRAM_CHAT_ID,
    });
  }

  evaluate(request: SpendRequest, simulate?: boolean): DecisionResult {
    const startTime = Date.now();
    const reference = `actonce_txn_${uuidv4()}`;
    const timestamp = request.timestamp || new Date();

    // Step 1: Policy check
    const policyResult = evaluatePolicy(request, this.policy);

    // Step 2: Dedupe check (only if policy hasn't already rejected)
    let dedupeMatch: DedupeMatch = { status: 'new', action: 'block' };
    if (policyResult.decision !== 'REJECTED') {
      dedupeMatch = this.dedupe.check(request);
    }

    // Step 3: Determine final decision based on 11-step order
    let finalDecision: SpendDecision = policyResult.decision;
    let finalReason = policyResult.policyReason;
    let finalMatched = policyResult.policyMatched;

    // Step 8: Duplicate check result
    if (dedupeMatch.status === 'duplicate') {
      if (dedupeMatch.action === 'block') {
        finalDecision = 'REJECTED';
        finalReason = `Duplicate detected within ${this.policy.dedupe_window_minutes}-minute window (previous: ${dedupeMatch.previousReference})`;
        finalMatched = 'duplicate_detected';
      } else if (dedupeMatch.action === 'require_approval') {
        if (finalDecision !== 'REJECTED') {
          finalDecision = 'REQUIRES_APPROVAL';
          finalReason = `Duplicate detected — requires approval (previous: ${dedupeMatch.previousReference})`;
          finalMatched = 'duplicate_requires_approval';
        }
      }
    }

    const timeToDecision = Date.now() - startTime;

    // If requires approval, queue it
    if (finalDecision === 'REQUIRES_APPROVAL' && !simulate) {
      this.approvalQueue.add(request, reference, finalReason);
    }

    // Record in dedupe store (only if not rejected due to duplicate, and not simulating)
    if (dedupeMatch.status !== 'duplicate' && !simulate) {
      this.dedupe.record(request, reference, timestamp);
    }

    const result: DecisionResult = {
      decision: finalDecision,
      transactionReference: reference,
      policyMatched: finalMatched,
      policyReason: finalReason,
      approvalRequired: finalDecision === 'REQUIRES_APPROVAL',
      dedupeStatus: dedupeMatch.status,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minute expiry
      timeToDecisionMs: timeToDecision,
    };

    // Log the decision (skip if simulating)
    if (!simulate) {
      const logEntry: LogEntry = {
      timestamp: timestamp.toISOString(),
      transactionReference: reference,
      requestId: request.requestId,
      agentId: request.agentId,
      taskId: request.taskId,
      decision: finalDecision,
      amount: request.amount,
      currency: request.currency,
      merchant: request.merchant,
      category: request.category,
      reason: request.reason,
      policyMatched: finalMatched,
      policyReason: finalReason,
      dedupeStatus: dedupeMatch.status,
      approvedBy: finalDecision === 'APPROVED' ? 'auto' : undefined,
      timeToDecisionMs: timeToDecision,
    };

      this.logger.log(logEntry);
    }

    return result;
  }

  approve(reference: string, approvedBy: string): boolean {
    const item = this.approvalQueue.approve(reference, approvedBy);
    if (item) {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        transactionReference: reference,
        agentId: item.agentId,
        taskId: item.taskId,
        decision: 'APPROVED',
        amount: item.amount,
        currency: item.currency,
        merchant: item.merchant,
        category: item.category,
        reason: item.reason,
        policyMatched: 'manual_approval',
        policyReason: `Manually approved by ${approvedBy}`,
        dedupeStatus: 'new',
        approvedBy,
        timeToDecisionMs: 0,
      };
      this.logger.log(logEntry);
      return true;
    }
    return false;
  }

  reject(reference: string, rejectedReason: string, rejectedBy?: string): boolean {
    const item = this.approvalQueue.reject(reference, rejectedReason, rejectedBy);
    if (item) {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        transactionReference: reference,
        agentId: item.agentId,
        taskId: item.taskId,
        decision: 'REJECTED',
        amount: item.amount,
        currency: item.currency,
        merchant: item.merchant,
        category: item.category,
        reason: item.reason,
        policyMatched: 'manual_rejection',
        policyReason: rejectedReason,
        dedupeStatus: 'new',
        approvedBy: rejectedBy,
        timeToDecisionMs: 0,
      };
      this.logger.log(logEntry);
      return true;
    }
    return false;
  }

  listPending(): PendingApproval[] {
    return this.approvalQueue.list();
  }

  getPolicy(): PolicyConfig {
    return this.policy;
  }

  logSpendResult(reference: string, status: 'completed' | 'failed', paymentMethod?: string, receiptUrl?: string, notes?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      transactionReference: reference,
      decision: status === 'completed' ? 'APPROVED' : 'REJECTED',
      amount: 0,
      currency: '',
      merchant: '',
      policyMatched: 'log_spend_result',
      policyReason: notes || `Payment ${status}${paymentMethod ? ` via ${paymentMethod}` : ''}${receiptUrl ? ` receipt: ${receiptUrl}` : ''}`,
      dedupeStatus: 'new',
      timeToDecisionMs: 0,
    };
    this.logger.log(entry);
  }

  close(): void {
    this.dedupe.close();
  }
}
