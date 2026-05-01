import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { type PendingApproval, type SpendRequest, type SpendDecision } from '@actonce/types';

export interface ApprovalQueueConfig {
  queuePath: string;
  telegramBotToken?: string;
  telegramChatId?: string;
}

export class ApprovalQueue {
  private queuePath: string;

  constructor(private config: ApprovalQueueConfig) {
    this.queuePath = config.queuePath;
    const dir = dirname(this.queuePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    if (!existsSync(this.queuePath)) {
      writeFileSync(this.queuePath, JSON.stringify([], null, 2));
    }
  }

  add(request: SpendRequest, reference: string, policyReason: string): PendingApproval {
    const pending: PendingApproval = {
      transactionReference: reference,
      requestedAt: new Date().toISOString(),
      amount: request.amount,
      currency: request.currency,
      merchant: request.merchant,
      category: request.category,
      reason: request.reason,
      agentId: request.agentId,
      taskId: request.taskId,
      policyReason,
      status: 'pending',
    };

    const queue = this.readQueue();
    queue.push(pending);
    this.writeQueue(queue);

    this.notifyTelegram(`Approval required: ${reference}\n${request.amount} ${request.currency} at ${request.merchant}\nReason: ${policyReason}`);

    return pending;
  }

  approve(reference: string, approvedBy: string): PendingApproval | null {
    const queue = this.readQueue();
    const item = queue.find((p) => p.transactionReference === reference && p.status === 'pending');
    if (!item) return null;

    item.status = 'approved';
    item.approvedBy = approvedBy;
    item.approvedAt = new Date().toISOString();
    this.writeQueue(queue);

    this.notifyTelegram(`Approved: ${reference} by ${approvedBy}`);
    return item;
  }

  reject(reference: string, rejectedReason: string, rejectedBy?: string): PendingApproval | null {
    const queue = this.readQueue();
    const item = queue.find((p) => p.transactionReference === reference && p.status === 'pending');
    if (!item) return null;

    item.status = 'rejected';
    item.rejectedAt = new Date().toISOString();
    item.rejectedReason = rejectedReason;
    if (rejectedBy) {
      item.approvedBy = rejectedBy;
    }
    this.writeQueue(queue);

    this.notifyTelegram(`Rejected: ${reference}\nReason: ${rejectedReason}`);
    return item;
  }

  list(): PendingApproval[] {
    return this.readQueue().filter((p) => p.status === 'pending');
  }

  get(reference: string): PendingApproval | undefined {
    return this.readQueue().find((p) => p.transactionReference === reference);
  }

  private readQueue(): PendingApproval[] {
    try {
      const data = readFileSync(this.queuePath, 'utf-8');
      return JSON.parse(data) as PendingApproval[];
    } catch {
      return [];
    }
  }

  private writeQueue(queue: PendingApproval[]): void {
    writeFileSync(this.queuePath, JSON.stringify(queue, null, 2));
  }

  private async notifyTelegram(message: string): Promise<void> {
    const { telegramBotToken, telegramChatId } = this.config;
    if (!telegramBotToken || !telegramChatId) return;

    try {
      await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
    } catch {
      // Silently fail if Telegram is unreachable
    }
  }
}
