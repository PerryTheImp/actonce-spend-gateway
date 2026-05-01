import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { type LogEntry } from '@actonce/types';

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  destination: 'file' | 'stdout';
  path?: string;
}

const LEVEL_PRIORITY: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class ActOnceLogger {
  constructor(private config: LoggerConfig) {
    if (config.destination === 'file' && config.path) {
      const dir = dirname(config.path);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  log(entry: LogEntry): void {
    if (!this.shouldLog(entry.decision === 'REJECTED' ? 'warn' : 'info')) {
      return;
    }

    const line = JSON.stringify(entry) + '\n';

    if (this.config.destination === 'file' && this.config.path) {
      appendFileSync(this.config.path, line);
    } else {
      process.stdout.write(line);
    }
  }

  debug(entry: LogEntry): void {
    if (this.shouldLog('debug')) {
      this.log({ ...entry, decision: entry.decision });
    }
  }

  private shouldLog(level: string): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.config.level];
  }
}
