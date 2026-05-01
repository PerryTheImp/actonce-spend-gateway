import { Command } from 'commander';
import { DecisionRouter, type GatewayConfig } from '@actonce/core';

export const pendingCommand = new Command('pending')
  .description('List pending approvals')
  .action(() => {
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
    const pending = router.listPending();
    router.close();

    if (pending.length === 0) {
      console.log('No pending approvals.');
      return;
    }

    for (const item of pending) {
      console.log(`- ${item.transactionReference}: ${item.amount} ${item.currency} at ${item.merchant}`);
      console.log(`  Reason: ${item.reason || 'N/A'}`);
      console.log(`  Policy reason: ${item.policyReason}`);
      console.log(`  Requested: ${item.requestedAt}`);
      console.log();
    }
  });
