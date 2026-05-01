export type SpendDecision = 'APPROVED' | 'REJECTED' | 'REQUIRES_APPROVAL';

export interface SpendRequest {
  amount: number;
  currency: string;
  merchant: string;
  category?: string;
  reason?: string;
  agentId?: string;
  taskId?: string;
  requestId?: string;
  timestamp?: Date;
}

export interface DecisionResult {
  decision: SpendDecision;
  transactionReference: string;
  policyMatched?: string;
  policyReason?: string;
  approvalRequired: boolean;
  dedupeStatus: DedupeStatus;
  expiresAt?: string;
  timeToDecisionMs: number;
}

export type DedupeStatus = 'new' | 'duplicate' | 'warn';
export type DedupeAction = 'block' | 'warn' | 'require_approval';

export interface DedupeMatch {
  status: DedupeStatus;
  action: DedupeAction;
  previousReference?: string;
  minutesSince?: number;
}

export interface LogEntry {
  timestamp: string;
  transactionReference: string;
  requestId?: string;
  agentId?: string;
  taskId?: string;
  decision: SpendDecision;
  amount: number;
  currency: string;
  merchant: string;
  category?: string;
  reason?: string;
  policyMatched?: string;
  policyReason?: string;
  dedupeStatus: DedupeStatus;
  approvedBy?: string;
  timeToDecisionMs: number;
}

export interface PendingApproval {
  transactionReference: string;
  requestedAt: string;
  amount: number;
  currency: string;
  merchant: string;
  category?: string;
  reason?: string;
  agentId?: string;
  taskId?: string;
  policyReason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
}

export interface PolicyConfig {
  version: string;
  default_mode: 'ask' | 'auto_approve' | 'block';
  currency: string;
  max_single_purchase: number;
  max_daily_spend: number;
  max_monthly_spend: number;
  require_human_approval_above: number;
  always_require_approval_for: string[];
  allowed_merchants: string[];
  blocked_merchants: string[];
  trusted_merchants: string[];
  allowed_categories: string[];
  blocked_categories: string[];
  allowed_hours: { start: string; end: string };
  timezone: string;
  dedupe_window_minutes: number;
  dedupe_match_on: string[];
  max_requests_per_agent_per_hour: number;
  max_requests_per_task: number;
  log_level: string;
  log_destination: string;
  log_path: string;
}
