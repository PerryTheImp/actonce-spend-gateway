import * as Database from 'better-sqlite3';
import { type SpendRequest, type DedupeMatch } from '@actonce/types';

export interface DedupeStore {
  save(request: SpendRequest, reference: string, timestamp: Date): void;
  findDuplicate(request: SpendRequest, windowMinutes: number, matchKeys: string[]): DedupeMatch;
  purge(olderThanMinutes: number): void;
  close(): void;
}

export class SQLiteDedupeStore implements DedupeStore {
  private db: Database.Database;

  constructor(dbPath = ':memory:' as string) {
    this.db = new Database.default(dbPath) as Database.Database;
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT NOT NULL UNIQUE,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        merchant TEXT NOT NULL,
        category TEXT,
        agent_id TEXT,
        task_id TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_txn_created ON transactions(created_at);
      CREATE INDEX IF NOT EXISTS idx_txn_merchant ON transactions(merchant);
    `);
  }

  save(request: SpendRequest, reference: string, timestamp: Date): void {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (reference, amount, currency, merchant, category, agent_id, task_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      reference,
      request.amount,
      request.currency,
      request.merchant,
      request.category || null,
      request.agentId || null,
      request.taskId || null,
      timestamp.toISOString()
    );
  }

  findDuplicate(request: SpendRequest, windowMinutes: number, matchKeys: string[]): DedupeMatch {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const keys = matchKeys.length > 0 ? matchKeys : ['amount', 'currency', 'merchant'];

    let whereParts: string[] = ['created_at >= ?'];
    const params: (string | number)[] = [cutoff];

    for (const key of keys) {
      switch (key) {
        case 'amount':
          whereParts.push('amount = ?');
          params.push(request.amount);
          break;
        case 'currency':
          whereParts.push('currency = ?');
          params.push(request.currency);
          break;
        case 'merchant':
          whereParts.push('merchant = ?');
          params.push(request.merchant);
          break;
        case 'category':
          if (request.category) {
            whereParts.push('category = ?');
            params.push(request.category);
          }
          break;
        case 'agent_id':
          if (request.agentId) {
            whereParts.push('agent_id = ?');
            params.push(request.agentId);
          }
          break;
        case 'task_id':
          if (request.taskId) {
            whereParts.push('task_id = ?');
            params.push(request.taskId);
          }
          break;
      }
    }

    const whereClause = whereParts.join(' AND ');
    const stmt = this.db.prepare(`
      SELECT reference, created_at, (julianday('now') - julianday(created_at)) * 24 * 60 AS minutes_since
      FROM transactions
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const row = stmt.get(...params) as { reference: string; created_at: string; minutes_since: number } | undefined;

    if (row) {
      return {
        status: 'duplicate',
        action: 'block',
        previousReference: row.reference,
        minutesSince: Math.round(row.minutes_since),
      };
    }

    return { status: 'new', action: 'block' };
  }

  purge(olderThanMinutes: number): void {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();
    this.db.prepare("DELETE FROM transactions WHERE created_at < ?").run(cutoff);
  }

  close(): void {
    this.db.close();
  }
}
