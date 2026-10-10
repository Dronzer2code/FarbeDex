// In-memory node:sqlite wrapped in the DbLike surface, so repository SQL runs unchanged in tests.
import type { BindValue, DbLike } from '../../src/db/types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite');

export function createTestDb(): DbLike {
  const raw = new DatabaseSync(':memory:');
  let depth = 0;
  const db: DbLike = {
    async execAsync(sql: string) {
      raw.exec(sql);
    },
    async runAsync(sql: string, ...params: BindValue[]) {
      return raw.prepare(sql).run(...params);
    },
    async getFirstAsync<T>(sql: string, ...params: BindValue[]) {
      return ((raw.prepare(sql).get(...params) as T | undefined) ?? null) as T | null;
    },
    async getAllAsync<T>(sql: string, ...params: BindValue[]) {
      return raw.prepare(sql).all(...params) as T[];
    },
    async withExclusiveTransactionAsync(task: (txn: DbLike) => Promise<void>) {
      if (depth > 0) return task(db);
      depth++;
      raw.exec('BEGIN EXCLUSIVE');
      try {
        await task(db);
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      } finally {
        depth--;
      }
    },
  };
  return db;
}
