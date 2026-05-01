import { Command } from 'commander';
import { DecisionRouter, type GatewayConfig } from '@actonce/core';
import { type SpendRequest } from '@actonce/types';

export const checkCommand = new Command('check')
  .description('Check a spend request via CLI')
  .requiredOption('--amount <n>', 'Amount to spend', parseFloat)
  .requiredOption('--currency <code>', 'Currency code')
  .requiredOption('--merchant <name>', 'Merchant name or domain')
  .option('--category <cat>', 'Spend category')
  .option('--reason <text>', 'Reason for spend')
  .option('--agent-id <id>', 'Agent ID')
  .option('--task-id <id>', 'Task ID')
  .option('--simulate', 'Run policy evaluation without logging or queuing', false)
  .action((options) => {
    const config: GatewayConfig = {
      policyPath: process.env.ACTONCE_POLICY_PATH,
      dbPath: process.env.ACTONCE_DB_PATH,
      logPath: process.env.ACTONCE_LOG_PATH,
      logDestination: (process.env.ACTONCE_LOG_DESTINATION as 'file' | 'stdout') || 'file',
      logLevel: (process.env.ACTONCE_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
      queuePath: process.env.ACTONCE_QUEUE_PATH || './data/approval-queue.json',
      telegramBotToken: process.env.ACTONCE_TELEGRAM_BOT_TOKEN,
      telegramChatId: process.env.ACTONCE_TELEGRAM_CHAT_ID,
    };

    const router = new DecisionRouter(config);

    const request: SpendRequest = {
      amount: options.amount,
      currency: options.currency,
      merchant: options.merchant,
      category: options.category,
      reason: options.reason,
      agentId: options.agentId,
      taskId: options.taskId,
    };

    const result = router.evaluate(request, options.simulate);
    router.close();

    console.log(JSON.stringify({
      decision: result.decision.toLowerCase(),
      transaction_reference: result.transactionReference,
      policy_matched: result.policyMatched,
      policy_reason: result.policyReason,
      approval_required: result.approvalRequired,
      dedupe_status: result.dedupeStatus,
      expires_at: result.expiresAt,
      time_to_decision_ms: result.timeToDecisionMs,
    }, null, 2));

    process.exit(result.decision === 'REJECTED' ? 1 : 0);
  });
