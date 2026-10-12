#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DecisionRouter, type GatewayConfig } from '@actonce/core';
import { type SpendRequest } from '@actonce/types';

const routerConfig: GatewayConfig = {
  policyPath: process.env.ACTONCE_POLICY_PATH,
  dbPath: process.env.ACTONCE_DB_PATH,
  logPath: process.env.ACTONCE_LOG_PATH,
  logDestination: (process.env.ACTONCE_LOG_DESTINATION as 'file' | 'stdout') || 'file',
  logLevel: (process.env.ACTONCE_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
  queuePath: process.env.ACTONCE_QUEUE_PATH || './data/approval-queue.json',
  telegramBotToken: process.env.ACTONCE_TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.ACTONCE_TELEGRAM_CHAT_ID,
};

const router = new DecisionRouter(routerConfig);
const server = new Server(
  { name: 'actonce-spend', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'check_spend',
        description: 'Evaluate a spend request against the active policy. Returns approved, rejected, or requires_approval.',
        inputSchema: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: 'Amount to spend' },
            currency: { type: 'string', description: 'Currency code (e.g. USD)' },
            merchant: { type: 'string', description: 'Merchant domain or name' },
            category: { type: 'string', description: 'Spend category (e.g. domains, software)' },
            reason: { type: 'string', description: 'Human-readable reason for spend' },
            agent_id: { type: 'string', description: 'ID of the requesting agent' },
            task_id: { type: 'string', description: 'ID of the task / project' },
            request_id: { type: 'string', description: 'Unique request ID' },
            simulate: { type: 'boolean', description: 'If true, evaluate without logging or queuing (placeholder — not yet implemented)' },
          },
          required: ['amount', 'currency', 'merchant'],
        },
      },
      {
        name: 'log_spend_result',
        description: 'Record the final outcome of a spend (completed or failed) after payment.',
        inputSchema: {
          type: 'object',
          properties: {
            transaction_reference: { type: 'string', description: 'Reference from check_spend response' },
            status: { type: 'string', enum: ['completed', 'failed'], description: 'Final payment status' },
            payment_method: { type: 'string', description: 'How payment was made (e.g. stripe_link_cli)' },
            receipt_url: { type: 'string', description: 'URL to receipt, if available' },
            notes: { type: 'string', description: 'Additional notes' },
          },
          required: ['transaction_reference', 'status'],
        },
      },
      {
        name: 'preview_policy',
        description: 'Return a read-only summary of the current policy so agents can self-check before calling check_spend.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;
  const args = (rawArgs ?? {}) as Record<string, unknown>;
  const toolArgs = args ?? {};

  if (name === 'check_spend') {
    const req: SpendRequest = {
      amount: Number(toolArgs.amount),
      currency: String(toolArgs.currency),
      merchant: String(toolArgs.merchant),
      category: toolArgs.category ? String(toolArgs.category) : undefined,
      reason: toolArgs.reason ? String(toolArgs.reason) : undefined,
      agentId: toolArgs.agent_id ? String(toolArgs.agent_id) : undefined,
      taskId: toolArgs.task_id ? String(toolArgs.task_id) : undefined,
      requestId: toolArgs.request_id ? String(toolArgs.request_id) : undefined,
    };

    const result = router.evaluate(req);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            decision: result.decision.toLowerCase(),
            transaction_reference: result.transactionReference,
            policy_matched: result.policyMatched,
            policy_reason: result.policyReason,
            approval_required: result.approvalRequired,
            dedupe_status: result.dedupeStatus,
            expires_at: result.expiresAt,
            time_to_decision_ms: result.timeToDecisionMs,
          }),
        },
      ],
    };
  }

  if (name === 'log_spend_result') {
    const reference = String(toolArgs.transaction_reference);
    const status = String(toolArgs.status) as 'completed' | 'failed';
    const paymentMethod = toolArgs.payment_method ? String(toolArgs.payment_method) : undefined;
    const receiptUrl = toolArgs.receipt_url ? String(toolArgs.receipt_url) : undefined;
    const notes = toolArgs.notes ? String(toolArgs.notes) : undefined;

    router.logSpendResult(reference, status, paymentMethod, receiptUrl, notes);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ logged: true, transaction_reference: reference, status }),
        },
      ],
    };
  }

  if (name === 'preview_policy') {
    const policy = router.getPolicy();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            version: policy.version,
            default_mode: policy.default_mode,
            currency: policy.currency,
            max_single_purchase: policy.max_single_purchase,
            max_daily_spend: policy.max_daily_spend,
            max_monthly_spend: policy.max_monthly_spend,
            require_human_approval_above: policy.require_human_approval_above,
            always_require_approval_for: policy.always_require_approval_for,
            allowed_merchants: policy.allowed_merchants,
            blocked_merchants: policy.blocked_merchants,
            trusted_merchants: policy.trusted_merchants,
            allowed_categories: policy.allowed_categories,
            blocked_categories: policy.blocked_categories,
            allowed_hours: policy.allowed_hours,
            timezone: policy.timezone,
            dedupe_window_minutes: policy.dedupe_window_minutes,
          }),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Keep process alive; stdio transport manages its own cleanup
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
