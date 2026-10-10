// Migrations via PRAGMA user_version; v1 also seeds the 151 Entry rows.
import { ENTRY_COUNT, MIGRATIONS } from './schema';
import type { DbLike } from './types';

export async function migrate(db: DbLike): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    const next = version + 1;
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(sql);
      if (next === 1) {
        for (let no = 1; no <= ENTRY_COUNT; no++) {
          await tx.runAsync('INSERT OR IGNORE INTO entries (no) VALUES (?)', no);
        }
      }
      await tx.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}
