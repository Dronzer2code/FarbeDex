import * as SQLite from 'expo-sqlite';

import { DB_NAME, ENTRY_COUNT, MIGRATIONS } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    const next = version + 1;
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(sql);
      if (next === 1) {
        // Seed the 151 Entry rows once.
        for (let no = 1; no <= ENTRY_COUNT; no++) {
          await tx.runAsync('INSERT OR IGNORE INTO entries (no) VALUES (?)', no);
        }
      }
      await tx.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}

/** Opens (once) and migrates the app database. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await migrate(db);
      return db;
    })().catch((e) => {
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}
