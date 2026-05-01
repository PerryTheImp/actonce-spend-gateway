#!/usr/bin/env node
import { program } from 'commander';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';
import { checkCommand } from './commands/check.js';
import { pendingCommand } from './commands/pending.js';
import { approveCommand } from './commands/approve.js';
import { rejectCommand } from './commands/reject.js';
import { logsCommand } from './commands/logs.js';

program
  .name('actonce-spend')
  .description('ActOnce Spend Gateway CLI')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(startCommand);
program.addCommand(checkCommand);
program.addCommand(pendingCommand);
program.addCommand(approveCommand);
program.addCommand(rejectCommand);
program.addCommand(logsCommand);

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
