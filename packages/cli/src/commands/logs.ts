import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { type LogEntry } from '@actonce/types';

export const logsCommand = new Command('logs')
  .description('Show recent log entries')
  .option('--last <n>', 'Show last N entries', '20')
  .option('--agent-id <id>', 'Filter by agent ID')
  .option('--merchant <name>', 'Filter by merchant')
  .option('--decision <d>', 'Filter by decision (approved, rejected, requires_approval)')
  .action((options) => {
    const logPath = process.env.ACTONCE_LOG_PATH || './logs/actonce-spend.log';

    if (!existsSync(logPath)) {
      console.log('No log file found at ' + logPath);
      return;
    }

    const lines = readFileSync(logPath, 'utf-8')
      .split('\n')
      .filter((l) => l.trim().length > 0);

    let entries: LogEntry[] = [];
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as LogEntry;
        entries.push(parsed);
      } catch {
        // skip malformed lines
      }
    }

    // Apply filters
    if (options.agentId) {
      entries = entries.filter((e) => e.agentId === options.agentId);
    }
    if (options.merchant) {
      entries = entries.filter((e) => e.merchant === options.merchant);
    }
    if (options.decision) {
      const d = options.decision.toUpperCase();
      entries = entries.filter((e) => e.decision === d);
    }

    const lastN = Number(options.last);
    entries = entries.slice(-lastN);

    if (entries.length === 0) {
      console.log('No matching log entries.');
      return;
    }

    for (const entry of entries) {
      console.log(`[${entry.timestamp}] ${entry.decision} | ${entry.amount} ${entry.currency} @ ${entry.merchant} | ref=${entry.transactionReference}`);
      if (entry.policyReason) console.log(`  reason: ${entry.policyReason}`);
      if (entry.agentId) console.log(`  agent: ${entry.agentId}`);
    }
  });
