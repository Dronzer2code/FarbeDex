// Neighbors — docs/DEX_SPEC.md → NEIGHBORS.
import { chromaticEntryNo, entryCoords, type Band } from './rules';

export type NeighborKind = 'Darker' | 'Lighter' | 'Dustier' | 'More vivid' | 'Prev hue' | 'Next hue';

export interface Neighbor {
  kind: NeighborKind;
  no: number;
}

export function neighborsOf(no: number): Neighbor[] {
  const { sector, lBand, cBand, neutralBand } = entryCoords(no);
  const out: Neighbor[] = [];
  if (neutralBand !== null) {
    if (neutralBand > 0) out.push({ kind: 'Darker', no: no - 1 });
    if (neutralBand < 6) out.push({ kind: 'Lighter', no: no + 1 });
    return out;
  }
  const s = sector!;
  const l = lBand!;
  const c = cBand!;
  if (l > 0) out.push({ kind: 'Darker', no: chromaticEntryNo(s, (l - 1) as Band, c) });
  if (l < 2) out.push({ kind: 'Lighter', no: chromaticEntryNo(s, (l + 1) as Band, c) });
  if (c > 0) out.push({ kind: 'Dustier', no: chromaticEntryNo(s, l, (c - 1) as Band) });
  if (c < 2) out.push({ kind: 'More vivid', no: chromaticEntryNo(s, l, (c + 1) as Band) });
  out.push({ kind: 'Prev hue', no: chromaticEntryNo((s + 15) % 16, l, c) });
  out.push({ kind: 'Next hue', no: chromaticEntryNo((s + 1) % 16, l, c) });
  return out;
}

/** Prev/next Entry number with wrap 151 → 1 (AC-F5.3). */
export function stepEntry(no: number, delta: 1 | -1, total = 151): number {
  return ((no - 1 + delta + total) % total) + 1;
}
