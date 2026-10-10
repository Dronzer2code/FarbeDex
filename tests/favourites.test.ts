// Pick-2-favourites registration + shiny colours (team request 2026-10-10) — real SQL on in-memory SQLite.
import type { Swatch } from '../src/color/extract';
import { oklchToOklab, oklabToHex, oklabToOklch } from '../src/color/oklab';
import { autoRegisterPending, commitCatch, deleteCatch, getCatch, registerFavourites, type NewCatch } from '../src/db/catchRepo';
import { catchesForEntry, getEntry } from '../src/db/entryRepo';
import { migrate } from '../src/db/migrate';
import type { DbLike } from '../src/db/types';
import { ENTRIES } from '../src/dex/entries.generated';
import { SHINY_ODDS, defaultFavourites, rollShiny } from '../src/dex/shiny';
import { createTestDb } from './helpers/nodeSqlite';

/** A swatch exactly on an Entry's canonical colour, so it maps to that Entry. */
function swOf(no: number, pct: number, rank: number): Swatch {
  const c = ENTRIES[no - 1].canonical;
  const ok = oklchToOklab({ l: c.l, c: c.c, h: c.h });
  return { entryNo: no, hex: oklabToHex(ok.l, ok.a, ok.b), oklch: oklabToOklch(ok), pct, isNew: false, rank };
}

const RARE_NO = ENTRIES.find((e) => e.rarity === 'MYTHICAL')!.no;
const COMMON_NO = 4;
const OTHER_NO = ENTRIES.find((e) => e.rarity === 'COMMON' && e.no > 7)!.no;

function catchOf(id: string, swatches: Swatch[]): NewCatch {
  return {
    id, createdAt: 1000, photoPath: `p/${id}`, thumbPath: `t/${id}`, width: 1, height: 1, subjectLabel: 'sky', subjectScore: 1,
    sceneLabel: 'OUTDOOR_NATURE', sceneScore: 1, otherPct: 0, liveChecks: {}, swatches,
  };
}

let db: DbLike;
beforeEach(async () => {
  db = createTestDb();
  await migrate(db);
});

describe('favourites', () => {
  const palette = () => [swOf(COMMON_NO, 50, 0), swOf(RARE_NO, 30, 1), swOf(OTHER_NO, 20, 2)];

  it('saving a catch counts nothing until favourites are picked', async () => {
    await commitCatch(db, catchOf('c1', palette()), { register: 'none' });
    for (const no of [COMMON_NO, RARE_NO, OTHER_NO]) expect((await getEntry(db, no))!.times_caught).toBe(0);
    expect((await getCatch(db, 'c1'))!.catch.registered).toBe(0);
  });

  it('only the 2 picked colours are registered (NEW only on them)', async () => {
    await commitCatch(db, catchOf('c1', palette()), { register: 'none' });
    const r = await registerFavourites(db, 'c1', [RARE_NO, OTHER_NO], () => 0.5);
    expect(r.newEntryNos.sort()).toEqual([RARE_NO, OTHER_NO].sort());
    expect((await getEntry(db, COMMON_NO))!.times_caught).toBe(0);
    expect((await getEntry(db, RARE_NO))!.times_caught).toBe(1);
    const c = (await getCatch(db, 'c1'))!;
    expect(c.swatches.find((s) => s.entry_no === COMMON_NO)).toMatchObject({ registered: 0, is_new: 0 });
    expect(c.swatches.find((s) => s.entry_no === RARE_NO)).toMatchObject({ registered: 1, is_new: 1 });
    expect((await catchesForEntry(db, COMMON_NO)).length).toBe(0);
  });

  it('caps at 2 picks and is idempotent', async () => {
    await commitCatch(db, catchOf('c1', palette()), { register: 'none' });
    await registerFavourites(db, 'c1', [COMMON_NO, RARE_NO, OTHER_NO], () => 0.5);
    const again = await registerFavourites(db, 'c1', [OTHER_NO], () => 0.5);
    expect(again.alreadyRegistered).toBe(true);
    expect(again.picks.map((p) => p.entryNo).sort()).toEqual([COMMON_NO, RARE_NO].sort());
    expect((await getEntry(db, OTHER_NO))!.times_caught).toBe(0);
    expect((await getEntry(db, COMMON_NO))!.times_caught).toBe(1);
  });

  it('shiny only for Rare+ picks, at 1/400, and recomputed on delete', async () => {
    expect(rollShiny('COMMON', () => 0)).toBe(false);
    expect(rollShiny('MYTHICAL', () => 0)).toBe(true);
    expect(rollShiny('MYTHICAL', () => 1 / SHINY_ODDS)).toBe(false);
    await commitCatch(db, catchOf('c1', palette()), { register: 'none' });
    const r = await registerFavourites(db, 'c1', [COMMON_NO, RARE_NO], () => 0); // forced lucky roll
    expect(r.picks.find((p) => p.entryNo === RARE_NO)!.shiny).toBe(true);
    expect(r.picks.find((p) => p.entryNo === COMMON_NO)!.shiny).toBe(false);
    expect((await getEntry(db, RARE_NO))!.shiny_count).toBe(1);
    await deleteCatch(db, 'c1');
    expect((await getEntry(db, RARE_NO))!.shiny_count).toBe(0);
  });

  it('pending catches auto-register their top 2 colours', async () => {
    await commitCatch(db, catchOf('c1', palette()), { register: 'none' });
    expect(await autoRegisterPending(db)).toEqual(['c1']);
    expect((await getEntry(db, COMMON_NO))!.times_caught).toBe(1);
    expect((await getEntry(db, RARE_NO))!.times_caught).toBe(1);
    expect((await getEntry(db, OTHER_NO))!.times_caught).toBe(0);
    expect(await autoRegisterPending(db)).toEqual([]);
    expect(defaultFavourites([{ entry_no: 9, pct: 10 }, { entry_no: 3, pct: 40 }, { entry_no: 5, pct: 20 }])).toEqual([3, 5]);
  });
});
