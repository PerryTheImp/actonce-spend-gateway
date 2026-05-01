import { type SpendRequest, type DedupeMatch, type DedupeAction } from '@actonce/types';
import { type DedupeStore, SQLiteDedupeStore } from './store.js';

export interface DedupeConfig {
  windowMinutes: number;
  matchKeys: string[];
  action: DedupeAction;
  dbPath?: string;
}

export class DedupeDetector {
  private store: DedupeStore;

  constructor(private config: DedupeConfig) {
    this.store = new SQLiteDedupeStore(config.dbPath || ':memory:');
  }

  check(request: SpendRequest): DedupeMatch {
    const match = this.store.findDuplicate(
      request,
      this.config.windowMinutes,
      this.config.matchKeys
    );

    // Override action from config
    if (match.status === 'duplicate') {
      return { ...match, action: this.config.action };
    }

    return match;
  }

  record(request: SpendRequest, reference: string, timestamp: Date): void {
    this.store.save(request, reference, timestamp);
  }

  purge(olderThanMinutes?: number): void {
    this.store.purge(olderThanMinutes || this.config.windowMinutes * 2);
  }

  close(): void {
    this.store.close();
  }
}
