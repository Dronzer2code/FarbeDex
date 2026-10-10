import * as SQLite from 'expo-sqlite';

import { migrate } from './migrate';
import { DB_NAME } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Opens (once) and migrates the app database. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await migrate(db);
      return db;
    })().catch((e) => {
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}
