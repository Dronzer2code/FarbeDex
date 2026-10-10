// Entries — docs/TRD.md → STORAGE.
import type { DbLike, EntryRow, NameSource } from './types';

export async function getAllEntries(db: DbLike): Promise<EntryRow[]> {
  return db.getAllAsync<EntryRow>('SELECT * FROM entries ORDER BY no');
}

export async function getEntry(db: DbLike, no: number): Promise<EntryRow | null> {
  return db.getFirstAsync<EntryRow>('SELECT * FROM entries WHERE no = ?', no);
}

export async function setEntryName(db: DbLike, no: number, name: string, source: NameSource): Promise<void> {
  await db.runAsync('UPDATE entries SET name = ?, name_source = ? WHERE no = ?', name, source, no);
}

/** Up to `limit` stored names, most recently first-caught first (Namer "names already used"). */
export async function recentNames(db: DbLike, limit = 40): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    'SELECT name FROM entries WHERE name IS NOT NULL ORDER BY COALESCE(first_caught_at, 0) DESC LIMIT ?',
    limit,
  );
  return rows.map((r) => r.name);
}

export async function allNames(db: DbLike): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>('SELECT name FROM entries WHERE name IS NOT NULL');
  return rows.map((r) => r.name);
}

export async function caughtCount(db: DbLike): Promise<number> {
  const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM entries WHERE times_caught > 0');
  return r?.n ?? 0;
}

export interface EntryCatchRef {
  catch_id: string;
  created_at: number;
  thumb_path: string;
  pct: number;
  subject_label: string | null;
}

/** Catches containing an Entry (Seen in / Found-in), newest first. */
export async function catchesForEntry(db: DbLike, no: number): Promise<EntryCatchRef[]> {
  return db.getAllAsync<EntryCatchRef>(
    `SELECT s.catch_id, c.created_at, c.thumb_path, s.pct, c.subject_label
       FROM swatches s JOIN catches c ON c.id = s.catch_id WHERE s.entry_no = ? AND s.registered = 1 ORDER BY c.created_at DESC`,
    no,
  );
}

/** Delete all data: catches gone, the 151 Entry rows reset (names cleared). */
export async function resetAllData(db: DbLike): Promise<void> {
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync('DELETE FROM swatches');
    await tx.runAsync('DELETE FROM catches');
    await tx.runAsync(
      `UPDATE entries SET name = NULL, name_source = NULL, times_caught = 0, sum_pct = 0, first_caught_at = NULL,
         first_catch_id = NULL, best_hex = NULL, best_distance = NULL, best_catch_id = NULL, shiny_count = 0`,
    );
  });
}

/**
 * One-time repair (2026-10-10): earlier Gemma names could contradict the colour (e.g. a pale blue named
 * "Dark Charcoal"). Names that do not end with the Entry's colour word revert to the template name.
 */
export async function repairMismatchedNames(db: DbLike, colourWordFor: (no: number) => string, templateFor: (no: number) => string): Promise<number> {
  const rows = await db.getAllAsync<{ no: number; name: string }>("SELECT no, name FROM entries WHERE name IS NOT NULL AND name_source = 'GEMMA'");
  let fixed = 0;
  for (const r of rows) {
    if (!r.name.toLowerCase().endsWith(` ${colourWordFor(r.no).toLowerCase()}`)) {
      await setEntryName(db, r.no, templateFor(r.no), 'TEMPLATE');
      fixed++;
    }
  }
  return fixed;
}
