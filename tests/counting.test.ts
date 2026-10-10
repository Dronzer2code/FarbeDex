// docs/DEX_SPEC.md → CATCH COUNTING; AC-F5.1, AC-F7.1, AC-F8.1 — real repository SQL on in-memory SQLite.
import type { Swatch } from '../src/color/extract';
import { hexToOklab, oklabToOklch } from '../src/color/oklab';
import { mulberry32 } from '../src/color/prng';
import { commitCatch, deleteCatch, getCatch, listCatches, type NewCatch } from '../src/db/catchRepo';
import { computeEntryStats } from '../src/db/counting';
import { caughtCount, catchesForEntry, getEntry, resetAllData, setEntryName } from '../src/db/entryRepo';
import { migrate } from '../src/db/migrate';
import type { DbLike, SwatchRow } from '../src/db/types';
import { entryNoForOklab } from '../src/dex/map';
import { createTestDb } from './helpers/nodeSqlite';

function sw(hex: string, pct: number, rank: number): Swatch {
  const ok = hexToOklab(hex);
  return { entryNo: entryNoForOklab(ok), hex, oklch: oklabToOklch(ok), pct, isNew: false, rank };
}

function catchOf(id: string, createdAt: number, swatches: Swatch[]): NewCatch {
  const otherPct = Math.round((100 - swatches.reduce((s, x) => s + x.pct, 0)) * 10) / 10;
  return {
    id, createdAt, photoPath: `catches/${id}.jpg`, thumbPath: `thumbs/${id}.jpg`, width: 100, height: 100,
    subjectLabel: 'moss', subjectScore: 0.8, sceneLabel: 'OUTDOOR_NATURE', sceneScore: 0.9, otherPct,
    liveChecks: { accepted: true }, swatches,
  };
}

let db: DbLike;
beforeEach(async () => {
  db = createTestDb();
  await migrate(db);
});

const GREEN = '#5F7A3A';
const SKY = '#78AAE6';
const BARK = '#5A4632';

describe('catch counting', () => {
  it('seeds 151 entries and migrates idempotently', async () => {
    await migrate(db);
    const n = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM entries');
    expect(n?.n).toBe(151);
  });

  it('commit sets times caught, first caught, NEW and best sample', async () => {
    const a = sw(GREEN, 60, 0);
    const b = sw(SKY, 40, 1);
    const r = await commitCatch(db, catchOf('c1', 1000, [a, b]));
    expect(r.newEntryNos.sort()).toEqual([a.entryNo, b.entryNo].sort());
    expect(r.swatches.every((s) => s.isNew)).toBe(true);
    const e = (await getEntry(db, a.entryNo))!;
    expect(e).toMatchObject({ times_caught: 1, sum_pct: 60, first_caught_at: 1000, first_catch_id: 'c1', best_hex: GREEN, best_catch_id: 'c1' });
    expect(await caughtCount(db)).toBe(2);

    const r2 = await commitCatch(db, catchOf('c2', 2000, [sw(GREEN, 30, 0), sw(BARK, 70, 1)]));
    expect(r2.swatches.find((s) => s.hex === GREEN)!.isNew).toBe(false);
    expect((await getEntry(db, a.entryNo))!).toMatchObject({ times_caught: 2, sum_pct: 90, first_catch_id: 'c1' });
    // AC-F5.1: times caught equals the number of catches containing it, listing exactly those photos.
    expect((await catchesForEntry(db, a.entryNo)).map((x) => x.catch_id)).toEqual(['c2', 'c1']);
    // AC-F8.1: NEW only on the catch that first caught the Entry.
    const c2 = (await getCatch(db, 'c2'))!;
    expect(c2.swatches.find((s) => s.hex === GREEN)!.is_new).toBe(0);
  });

  it('delete recomputes; an Entry caught only there becomes missing but keeps its name (AC-F7.1)', async () => {
    const g = sw(GREEN, 60, 0);
    await commitCatch(db, catchOf('c1', 1000, [g, sw(SKY, 40, 1)]));
    await commitCatch(db, catchOf('c2', 2000, [sw(GREEN, 50, 0), sw(BARK, 50, 1)]));
    await setEntryName(db, sw(BARK, 0, 0).entryNo, 'Old Gate Bark', 'GEMMA');

    const paths = await deleteCatch(db, 'c2');
    expect(paths).toEqual({ photoPath: 'catches/c2.jpg', thumbPath: 'thumbs/c2.jpg' });
    const bark = (await getEntry(db, sw(BARK, 0, 0).entryNo))!;
    expect(bark).toMatchObject({ times_caught: 0, sum_pct: 0, first_catch_id: null, best_hex: null, name: 'Old Gate Bark' });
    expect((await getEntry(db, g.entryNo))!).toMatchObject({ times_caught: 1, sum_pct: 60, first_catch_id: 'c1' });

    await deleteCatch(db, 'c1');
    expect((await getEntry(db, g.entryNo))!.first_catch_id).toBeNull();
    // Re-catch: becomes NEW again with the same name.
    const r = await commitCatch(db, catchOf('c3', 3000, [sw(BARK, 100, 0)]));
    expect(r.swatches[0].isNew).toBe(true);
    expect((await getEntry(db, sw(BARK, 0, 0).entryNo))!.name).toBe('Old Gate Bark');
  });

  it('deleting the first catch moves NEW and first-caught to the next catch', async () => {
    await commitCatch(db, catchOf('c1', 1000, [sw(GREEN, 100, 0)]));
    await commitCatch(db, catchOf('c2', 2000, [sw(GREEN, 100, 0)]));
    await deleteCatch(db, 'c1');
    const g = (await getEntry(db, sw(GREEN, 0, 0).entryNo))!;
    expect(g).toMatchObject({ times_caught: 1, first_catch_id: 'c2', first_caught_at: 2000 });
    expect((await getCatch(db, 'c2'))!.swatches[0].is_new).toBe(1);
  });

  it('best sample is the swatch closest to the canonical colour, recomputed on delete', async () => {
    // Two greens mapping to the same Entry; the closer one should win.
    const near = sw('#5F7A3A', 100, 0);
    const far = sw('#58753A', 100, 0);
    expect(far.entryNo).toBe(near.entryNo);
    await commitCatch(db, catchOf('c1', 1000, [near]));
    await commitCatch(db, catchOf('c2', 2000, [far]));
    const e = (await getEntry(db, near.entryNo))!;
    const want = computeEntryStats(near.entryNo, [
      { catchId: 'c1', createdAt: 1000, pct: 100, hex: near.hex, ...near.oklch },
      { catchId: 'c2', createdAt: 2000, pct: 100, hex: far.hex, ...far.oklch },
    ]);
    expect(e.best_catch_id).toBe(want.bestCatchId);
    await deleteCatch(db, want.bestCatchId!);
    expect((await getEntry(db, near.entryNo))!.best_catch_id).not.toBe(want.bestCatchId);
  });

  it('incremental commits equal a full recompute (random sequence)', async () => {
    const rand = mulberry32(3);
    const palette = ['#5F7A3A', '#78AAE6', '#5A4632', '#D23C5A', '#E6D23C', '#3C3C46', '#F0F0F0', '#2D5A8C'];
    for (let i = 0; i < 25; i++) {
      const chosen = palette.filter(() => rand() < 0.4).slice(0, 4);
      if (chosen.length === 0) chosen.push(palette[i % palette.length]);
      const seen = new Set<number>();
      const sws = chosen
        .map((h, r) => sw(h, Math.round((100 / chosen.length) * 10) / 10, r))
        .filter((s) => !seen.has(s.entryNo) && seen.add(s.entryNo));
      await commitCatch(db, catchOf(`c${i}`, 1000 + i, sws));
      if (rand() < 0.25 && i > 0) await deleteCatch(db, `c${Math.floor(rand() * i)}`);
    }
    for (let no = 1; no <= 151; no++) {
      const rows = await db.getAllAsync<SwatchRow & { created_at: number }>(
        'SELECT s.*, c.created_at FROM swatches s JOIN catches c ON c.id = s.catch_id WHERE s.entry_no = ?', no,
      );
      const want = computeEntryStats(no, rows.map((r) => ({ catchId: r.catch_id, createdAt: r.created_at, pct: r.pct, hex: r.hex, l: r.ok_l, c: r.ok_c, h: r.ok_h })));
      const e = (await getEntry(db, no))!;
      expect({ no, t: e.times_caught, s: e.sum_pct, f: e.first_catch_id, b: e.best_catch_id }).toEqual({
        no, t: want.timesCaught, s: want.sumPct, f: want.firstCatchId, b: want.bestCatchId,
      });
    }
  });

  it('album lists newest first with strips; reset clears everything', async () => {
    await commitCatch(db, catchOf('c1', 1000, [sw(GREEN, 70, 0), sw(SKY, 30, 1)]));
    await commitCatch(db, catchOf('c2', 2000, [sw(BARK, 100, 0)]));
    const list = await listCatches(db);
    expect(list.map((c) => c.id)).toEqual(['c2', 'c1']);
    expect(list[1].strip.map((s) => s.pct)).toEqual([70, 30]);
    await resetAllData(db);
    expect(await caughtCount(db)).toBe(0);
    expect(await listCatches(db)).toEqual([]);
  });
});
