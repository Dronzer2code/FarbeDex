// Catches: commit (one transaction) and delete (full recompute) — docs/TRD.md → STORAGE.
import type { MinoritySwatch, Swatch } from '../color/extract';
import { ENTRIES } from '../dex/entries.generated';
import { FAVOURITES_PER_CATCH, defaultFavourites, rollShiny } from '../dex/shiny';
import { bestDistance, computeEntryStats, type EntrySample } from './counting';
import type { CatchRow, DbLike, EntryRow, SwatchRow } from './types';

export interface NewCatch {
  id: string;
  createdAt: number;
  photoPath: string;
  thumbPath: string;
  width: number;
  height: number;
  subjectLabel: string | null;
  subjectScore: number | null;
  sceneLabel: string;
  sceneScore: number;
  otherPct: number;
  liveChecks: unknown;
  swatches: Swatch[];
  minority?: MinoritySwatch[];
}

export interface CommitResult {
  swatches: Swatch[];
  newEntryNos: number[];
}

export interface RegisteredPick {
  entryNo: number;
  isNew: boolean;
  shiny: boolean;
}

const finite = (v: number | null, fallback: number | null = 0) => (v !== null && Number.isFinite(v) ? v : fallback);

/** Applies CATCH COUNTING for one swatch of a catch and marks it registered (inside a transaction). */
async function registerSwatchTx(
  tx: DbLike,
  catchId: string,
  createdAt: number,
  s: { entryNo: number; hex: string; oklch: { l: number; c: number; h: number }; pct: number },
  shiny: boolean,
): Promise<boolean> {
  const e = await tx.getFirstAsync<EntryRow>('SELECT * FROM entries WHERE no = ?', s.entryNo);
  if (!e) throw new Error(`Entry ${s.entryNo} missing`);
  const isNew = e.times_caught === 0;
  const d = bestDistance(s.entryNo, s.oklch);
  const better = e.best_distance === null || d < e.best_distance;
  await tx.runAsync(
    `UPDATE entries SET times_caught = times_caught + 1, sum_pct = ROUND(sum_pct + ?, 1),
       first_caught_at = CASE WHEN ? THEN ? ELSE first_caught_at END,
       first_catch_id = CASE WHEN ? THEN ? ELSE first_catch_id END,
       best_hex = CASE WHEN ? THEN ? ELSE best_hex END,
       best_distance = CASE WHEN ? THEN ? ELSE best_distance END,
       best_catch_id = CASE WHEN ? THEN ? ELSE best_catch_id END,
       shiny_count = shiny_count + ?
     WHERE no = ?`,
    s.pct, isNew ? 1 : 0, createdAt, isNew ? 1 : 0, catchId,
    better ? 1 : 0, s.hex, better ? 1 : 0, d, better ? 1 : 0, catchId, shiny ? 1 : 0, s.entryNo,
  );
  await tx.runAsync(
    'UPDATE swatches SET registered = 1, is_new = ?, shiny = ? WHERE catch_id = ? AND entry_no = ?',
    isNew ? 1 : 0, shiny ? 1 : 0, catchId, s.entryNo,
  );
  return isNew;
}

/**
 * Saves a Catch with its full palette. `register: 'all'` counts every swatch (tests / legacy);
 * `'none'` (the app) counts nothing until the user picks favourites with registerFavourites().
 */
export async function commitCatch(db: DbLike, c: NewCatch, opts: { register: 'all' | 'none' } = { register: 'all' }): Promise<CommitResult> {
  const swatches: Swatch[] = [];
  const newEntryNos: number[] = [];
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `INSERT INTO catches (id, created_at, photo_path, thumb_path, width, height, subject_label, subject_score,
        scene_label, scene_score, other_pct, note, live_checks, minority, registered) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
      c.id, c.createdAt, c.photoPath, c.thumbPath, c.width, c.height, c.subjectLabel, finite(c.subjectScore, null),
      c.sceneLabel, finite(c.sceneScore), finite(c.otherPct), JSON.stringify(c.liveChecks), JSON.stringify(c.minority ?? []),
      opts.register === 'all' ? 1 : 0,
    );
    for (const s of c.swatches) {
      await tx.runAsync(
        `INSERT INTO swatches (catch_id, entry_no, hex, ok_l, ok_c, ok_h, pct, is_new, rank, registered, shiny) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0, 0)`,
        c.id, s.entryNo, s.hex, s.oklch.l, s.oklch.c, s.oklch.h, s.pct, s.rank,
      );
      let isNew = false;
      if (opts.register === 'all') isNew = await registerSwatchTx(tx, c.id, c.createdAt, s, false);
      swatches.push({ ...s, isNew });
      if (isNew) newEntryNos.push(s.entryNo);
    }
  });
  return { swatches, newEntryNos };
}

/**
 * Registers the user's favourite colours of a Catch (team rule 2026-10-10: pick 2). Rolls the shiny chance
 * for Rare+ picks. Idempotent: a Catch that is already registered returns its existing picks.
 */
export async function registerFavourites(
  db: DbLike,
  catchId: string,
  entryNos: number[],
  rand: () => number = Math.random,
): Promise<{ picks: RegisteredPick[]; newEntryNos: number[]; alreadyRegistered: boolean }> {
  const picks: RegisteredPick[] = [];
  let alreadyRegistered = false;
  await db.withExclusiveTransactionAsync(async (tx) => {
    const c = await tx.getFirstAsync<CatchRow>('SELECT * FROM catches WHERE id = ?', catchId);
    if (!c) throw new Error(`Catch ${catchId} missing`);
    if (c.registered === 1) {
      alreadyRegistered = true;
      const done = await tx.getAllAsync<SwatchRow>('SELECT * FROM swatches WHERE catch_id = ? AND registered = 1', catchId);
      for (const r of done) picks.push({ entryNo: r.entry_no, isNew: r.is_new === 1, shiny: r.shiny === 1 });
      return;
    }
    const rows = await tx.getAllAsync<SwatchRow>('SELECT * FROM swatches WHERE catch_id = ? ORDER BY rank', catchId);
    const chosen = rows.filter((r) => entryNos.includes(r.entry_no)).slice(0, FAVOURITES_PER_CATCH);
    for (const r of chosen) {
      const shiny = rollShiny(ENTRIES[r.entry_no - 1].rarity, rand);
      const isNew = await registerSwatchTx(
        tx,
        catchId,
        c.created_at,
        { entryNo: r.entry_no, hex: r.hex, oklch: { l: r.ok_l, c: r.ok_c, h: r.ok_h }, pct: r.pct },
        shiny,
      );
      picks.push({ entryNo: r.entry_no, isNew, shiny });
    }
    await tx.runAsync('UPDATE catches SET registered = 1 WHERE id = ?', catchId);
  });
  return { picks, newEntryNos: picks.filter((p) => p.isNew).map((p) => p.entryNo), alreadyRegistered };
}

/** Catches whose favourites were never chosen (e.g. the app was closed) get their top colours registered. */
export async function autoRegisterPending(db: DbLike): Promise<string[]> {
  const pending = await db.getAllAsync<{ id: string }>('SELECT id FROM catches WHERE registered = 0 ORDER BY created_at');
  for (const { id } of pending) {
    const rows = await db.getAllAsync<SwatchRow>('SELECT entry_no, pct FROM swatches WHERE catch_id = ?', id);
    await registerFavourites(db, id, defaultFavourites(rows));
  }
  return pending.map((p) => p.id);
}

async function recomputeEntry(tx: DbLike, no: number): Promise<void> {
  const rows = await tx.getAllAsync<SwatchRow & { created_at: number }>(
    `SELECT s.*, c.created_at FROM swatches s JOIN catches c ON c.id = s.catch_id WHERE s.entry_no = ? AND s.registered = 1`,
    no,
  );
  const samples: EntrySample[] = rows.map((r) => ({
    catchId: r.catch_id, createdAt: r.created_at, pct: r.pct, hex: r.hex, l: r.ok_l, c: r.ok_c, h: r.ok_h,
  }));
  const st = computeEntryStats(no, samples);
  const shinyCount = rows.filter((r) => r.shiny === 1).length;
  // Name and name_source are intentionally untouched: an uncaught Entry keeps its name.
  await tx.runAsync(
    `UPDATE entries SET times_caught = ?, sum_pct = ?, first_caught_at = ?, first_catch_id = ?,
       best_hex = ?, best_distance = ?, best_catch_id = ?, shiny_count = ? WHERE no = ?`,
    st.timesCaught, st.sumPct, st.firstCaughtAt, st.firstCatchId, st.bestHex, st.bestDistance, st.bestCatchId, shinyCount, no,
  );
  // NEW marks the registered Swatch of the Catch that (now) first caught the Entry.
  await tx.runAsync(
    'UPDATE swatches SET is_new = CASE WHEN catch_id = ? AND registered = 1 THEN 1 ELSE 0 END WHERE entry_no = ?',
    st.firstCatchId, no,
  );
}

/** Deletes a Catch and recomputes affected Entries. Returns the file paths for the caller to delete. */
export async function deleteCatch(db: DbLike, id: string): Promise<{ photoPath: string; thumbPath: string } | null> {
  let paths: { photoPath: string; thumbPath: string } | null = null;
  await db.withExclusiveTransactionAsync(async (tx) => {
    const c = await tx.getFirstAsync<CatchRow>('SELECT * FROM catches WHERE id = ?', id);
    if (!c) return;
    paths = { photoPath: c.photo_path, thumbPath: c.thumb_path };
    const affected = await tx.getAllAsync<{ entry_no: number }>('SELECT entry_no FROM swatches WHERE catch_id = ?', id);
    await tx.runAsync('DELETE FROM swatches WHERE catch_id = ?', id);
    await tx.runAsync('DELETE FROM catches WHERE id = ?', id);
    for (const { entry_no } of affected) await recomputeEntry(tx, entry_no);
  });
  return paths;
}

export async function setCatchNote(db: DbLike, id: string, note: string | null): Promise<void> {
  await db.runAsync('UPDATE catches SET note = ? WHERE id = ?', note, id);
}

export async function setCatchTitle(db: DbLike, id: string, title: string | null): Promise<void> {
  await db.runAsync('UPDATE catches SET title = ? WHERE id = ?', title, id);
}

export async function getCatch(db: DbLike, id: string): Promise<{ catch: CatchRow; swatches: SwatchRow[] } | null> {
  const c = await db.getFirstAsync<CatchRow>('SELECT * FROM catches WHERE id = ?', id);
  if (!c) return null;
  const swatches = await db.getAllAsync<SwatchRow>('SELECT * FROM swatches WHERE catch_id = ? ORDER BY rank', id);
  return { catch: c, swatches };
}

export interface CatchSummary {
  id: string;
  created_at: number;
  thumb_path: string;
  other_pct: number;
  subject_label: string | null;
  strip: { hex: string; pct: number }[];
}

export function parseMinority(json: string | null | undefined): MinoritySwatch[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((m) => m && typeof m.hex === 'string' && Number.isFinite(m.pct)) : [];
  } catch {
    return [];
  }
}

/** Album list, newest first, each with its Distribution strip. */
export async function listCatches(db: DbLike, limit = 1000): Promise<CatchSummary[]> {
  const catches = await db.getAllAsync<CatchRow>('SELECT * FROM catches ORDER BY created_at DESC LIMIT ?', limit);
  if (catches.length === 0) return [];
  const sw = await db.getAllAsync<SwatchRow>('SELECT catch_id, hex, pct, rank FROM swatches ORDER BY catch_id, rank');
  const byCatch = new Map<string, { hex: string; pct: number }[]>();
  for (const s of sw) {
    const list = byCatch.get(s.catch_id) ?? [];
    list.push({ hex: s.hex, pct: s.pct });
    byCatch.set(s.catch_id, list);
  }
  return catches.map((c) => ({
    id: c.id,
    created_at: c.created_at,
    thumb_path: c.thumb_path,
    other_pct: c.other_pct,
    subject_label: c.subject_label,
    strip: byCatch.get(c.id) ?? [],
  }));
}

export async function countCatches(db: DbLike): Promise<number> {
  const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM catches');
  return r?.n ?? 0;
}

/** All catch file paths (for "Delete all data"). */
export async function allCatchPaths(db: DbLike): Promise<string[]> {
  const rows = await db.getAllAsync<{ photo_path: string; thumb_path: string }>('SELECT photo_path, thumb_path FROM catches');
  return rows.flatMap((r) => [r.photo_path, r.thumb_path]);
}
