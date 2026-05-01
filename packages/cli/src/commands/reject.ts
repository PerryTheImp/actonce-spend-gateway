import { Command } from 'commander';
import { DecisionRouter, type GatewayConfig } from '@actonce/core';

export const rejectCommand = new Command('reject')
  .description('Reject a queued request')
  .argument('<reference>', 'Transaction reference to reject')
  .requiredOption('--reason <text>', 'Reason for rejection')
  .option('--by <name>', 'Name of rejecter', 'cli-user')
  .action((reference, options) => {
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
    const ok = router.reject(reference, options.reason, options.by);
    router.close();

    if (ok) {
      console.log(`Rejected ${reference} by ${options.by}`);
      process.exit(0);
    } else {
      console.error(`Reference not found or not pending: ${reference}`);
      process.exit(1);
    }
  });
