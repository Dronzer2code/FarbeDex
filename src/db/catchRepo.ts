// Catches: commit (one transaction) and delete (full recompute) — docs/TRD.md → STORAGE.
import type { MinoritySwatch, Swatch } from '../color/extract';
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

const finite = (v: number | null, fallback: number | null = 0) => (v !== null && Number.isFinite(v) ? v : fallback);

export async function commitCatch(db: DbLike, c: NewCatch): Promise<CommitResult> {
  const swatches: Swatch[] = [];
  const newEntryNos: number[] = [];
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `INSERT INTO catches (id, created_at, photo_path, thumb_path, width, height, subject_label, subject_score,
        scene_label, scene_score, other_pct, note, live_checks, minority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      c.id, c.createdAt, c.photoPath, c.thumbPath, c.width, c.height, c.subjectLabel, finite(c.subjectScore, null),
      c.sceneLabel, finite(c.sceneScore), finite(c.otherPct), JSON.stringify(c.liveChecks), JSON.stringify(c.minority ?? []),
    );
    for (const s of c.swatches) {
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
           best_catch_id = CASE WHEN ? THEN ? ELSE best_catch_id END
         WHERE no = ?`,
        s.pct, isNew ? 1 : 0, c.createdAt, isNew ? 1 : 0, c.id,
        better ? 1 : 0, s.hex, better ? 1 : 0, d, better ? 1 : 0, c.id, s.entryNo,
      );
      await tx.runAsync(
        `INSERT INTO swatches (catch_id, entry_no, hex, ok_l, ok_c, ok_h, pct, is_new, rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        c.id, s.entryNo, s.hex, s.oklch.l, s.oklch.c, s.oklch.h, s.pct, isNew ? 1 : 0, s.rank,
      );
      swatches.push({ ...s, isNew });
      if (isNew) newEntryNos.push(s.entryNo);
    }
  });
  return { swatches, newEntryNos };
}

async function recomputeEntry(tx: DbLike, no: number): Promise<void> {
  const rows = await tx.getAllAsync<SwatchRow & { created_at: number }>(
    `SELECT s.*, c.created_at FROM swatches s JOIN catches c ON c.id = s.catch_id WHERE s.entry_no = ?`,
    no,
  );
  const samples: EntrySample[] = rows.map((r) => ({
    catchId: r.catch_id, createdAt: r.created_at, pct: r.pct, hex: r.hex, l: r.ok_l, c: r.ok_c, h: r.ok_h,
  }));
  const st = computeEntryStats(no, samples);
  // Name and name_source are intentionally untouched: an uncaught Entry keeps its name.
  await tx.runAsync(
    `UPDATE entries SET times_caught = ?, sum_pct = ?, first_caught_at = ?, first_catch_id = ?,
       best_hex = ?, best_distance = ?, best_catch_id = ? WHERE no = ?`,
    st.timesCaught, st.sumPct, st.firstCaughtAt, st.firstCatchId, st.bestHex, st.bestDistance, st.bestCatchId, no,
  );
  // NEW marks the Swatch of the Catch that (now) first caught the Entry.
  await tx.runAsync('UPDATE swatches SET is_new = CASE WHEN catch_id = ? THEN 1 ELSE 0 END WHERE entry_no = ?', st.firstCatchId, no);
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
