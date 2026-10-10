// Pure catch-counting rules — docs/DEX_SPEC.md → CATCH COUNTING.
import { deltaEOK, oklchToOklab } from '../color/oklab';
import { ENTRIES } from '../dex/entries.generated';

export function canonicalOklab(no: number) {
  const { l, c, h } = ENTRIES[no - 1].canonical;
  return oklchToOklab({ l, c, h });
}

/** ΔE_OK between a Swatch value (OKLCH) and its Entry's canonical colour. */
export function bestDistance(no: number, oklch: { l: number; c: number; h: number }): number {
  return deltaEOK(oklchToOklab(oklch), canonicalOklab(no));
}

export interface EntrySample {
  catchId: string;
  createdAt: number;
  pct: number;
  hex: string;
  l: number;
  c: number;
  h: number;
}

export interface EntryStats {
  timesCaught: number;
  sumPct: number;
  firstCaughtAt: number | null;
  firstCatchId: string | null;
  bestHex: string | null;
  bestDistance: number | null;
  bestCatchId: string | null;
}

/** Recomputes an Entry's stats from all remaining Swatches of that Entry (one per Catch). */
export function computeEntryStats(no: number, samples: readonly EntrySample[]): EntryStats {
  const stats: EntryStats = {
    timesCaught: 0,
    sumPct: 0,
    firstCaughtAt: null,
    firstCatchId: null,
    bestHex: null,
    bestDistance: null,
    bestCatchId: null,
  };
  const ordered = [...samples].sort((p, q) => p.createdAt - q.createdAt || (p.catchId < q.catchId ? -1 : 1));
  for (const s of ordered) {
    stats.timesCaught += 1;
    stats.sumPct += s.pct;
    if (stats.firstCatchId === null) {
      stats.firstCaughtAt = s.createdAt;
      stats.firstCatchId = s.catchId;
    }
    const d = bestDistance(no, s);
    if (stats.bestDistance === null || d < stats.bestDistance) {
      stats.bestDistance = d;
      stats.bestHex = s.hex;
      stats.bestCatchId = s.catchId;
    }
  }
  stats.sumPct = Math.round(stats.sumPct * 10) / 10;
  return stats;
}
